import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffprobePath from "@ffprobe-installer/ffprobe";
import { prisma, MediaKind, track } from "@souvenir/db";
import { supabaseAdmin, ORIGINALS_BUCKET, PREVIEWS_BUCKET } from "../lib/supabase.js";
import { MAX_FILE_SIZE_BYTES, MAX_VIDEO_DURATION_SEC } from "../lib/limits.js";

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

interface ProcessPreviewParams {
  mediaId: string;
}

export async function processPreviewJob({ mediaId }: ProcessPreviewParams): Promise<void> {
  const media = await prisma.media.findUniqueOrThrow({
    where: { id: mediaId },
    include: {
      delivery: { include: { session: { include: { operator: true } } } },
      importBatch: { include: { session: { include: { operator: true } } } },
    },
  });

  const operator = media.delivery?.session.operator ?? media.importBatch?.session.operator;
  if (!operator) throw new Error(`Media ${mediaId} has no delivery or import batch`);

  await prisma.media.update({ where: { id: mediaId }, data: { status: "PROCESSING" } });

  if (media.sizeBytes && media.sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Media ${mediaId} exceeds max file size`);
  }

  const dir = await mkdtemp(join(tmpdir(), "souvenir-"));
  try {
    const { data: original, error } = await supabaseAdmin.storage.from(ORIGINALS_BUCKET).download(media.originalKey);
    if (error || !original) throw error ?? new Error("Failed to download original");

    const inputPath = join(dir, "input");
    await writeFile(inputPath, Buffer.from(await original.arrayBuffer()));

    if (media.kind === MediaKind.PHOTO) {
      await processPhoto({ mediaId, inputPath, dir, operator });
    } else {
      await processVideo({ mediaId, inputPath, dir, operator });
    }

    await prisma.media.update({ where: { id: mediaId }, data: { status: "READY" } });

    await track("media_ready", {
      operatorId: operator.id,
      deliveryId: media.deliveryId ?? undefined,
      meta: { mediaId },
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

interface OperatorBrand {
  logoUrl: string | null;
}

async function watermarkBuffer(image: sharp.Sharp, operator: OperatorBrand, width: number): Promise<Buffer> {
  if (!operator.logoUrl) return image.toBuffer();

  try {
    const logoRes = await fetch(operator.logoUrl);
    const contentType = logoRes.headers.get("content-type") ?? "";
    if (!logoRes.ok || !contentType.startsWith("image/")) {
      throw new Error(`logo URL did not return an image (status ${logoRes.status}, content-type "${contentType}")`);
    }

    const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
    const logoWidth = Math.round(width * 0.18);
    const logo = await sharp(logoBuffer)
      .resize({ width: logoWidth })
      .composite([{ input: Buffer.from([255, 255, 255, Math.round(255 * 0.6)]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: "dest-in" }])
      .toBuffer();

    return image.composite([{ input: logo, gravity: "southeast" }]).toBuffer();
  } catch (error) {
    console.error("[worker] watermark skipped, invalid operator logo", operator.logoUrl, error);
    return image.toBuffer();
  }
}

async function processPhoto({
  mediaId,
  inputPath,
  dir,
  operator,
}: {
  mediaId: string;
  inputPath: string;
  dir: string;
  operator: OperatorBrand;
}): Promise<void> {
  const thumbBuffer = await sharp(inputPath).resize({ width: 480 }).jpeg({ quality: 70 }).toBuffer();

  const previewBase = sharp(inputPath).resize({ width: 1280 });
  const previewBuffer = await watermarkBuffer(previewBase.jpeg({ quality: 78 }), operator, 1280);

  const thumbKey = `${mediaId}/thumb.jpg`;
  const previewKey = `${mediaId}/preview.jpg`;

  await Promise.all([
    supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(thumbKey, thumbBuffer, { contentType: "image/jpeg", upsert: true }),
    supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(previewKey, previewBuffer, { contentType: "image/jpeg", upsert: true }),
  ]);

  await prisma.media.update({ where: { id: mediaId }, data: { thumbKey, previewKey } });

  void dir;
}

async function processVideo({
  mediaId,
  inputPath,
  dir,
  operator,
}: {
  mediaId: string;
  inputPath: string;
  dir: string;
  operator: OperatorBrand;
}): Promise<void> {
  const duration = await getDurationSec(inputPath);
  if (duration > MAX_VIDEO_DURATION_SEC) {
    throw new Error(`Media ${mediaId} exceeds max video duration`);
  }

  const thumbPath = join(dir, "thumb.jpg");
  const previewPath = join(dir, "preview.mp4");

  await extractThumbnail(inputPath, thumbPath);
  await transcodePreview(inputPath, previewPath, operator.logoUrl);

  const [thumbBuffer, previewBuffer] = await Promise.all([readFile(thumbPath), readFile(previewPath)]);

  const thumbKey = `${mediaId}/thumb.jpg`;
  const previewKey = `${mediaId}/preview.mp4`;

  await Promise.all([
    supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(thumbKey, thumbBuffer, { contentType: "image/jpeg", upsert: true }),
    supabaseAdmin.storage.from(PREVIEWS_BUCKET).upload(previewKey, previewBuffer, { contentType: "video/mp4", upsert: true }),
  ]);

  await prisma.media.update({ where: { id: mediaId }, data: { thumbKey, previewKey, durationSec: Math.round(duration) } });
}

function getDurationSec(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration ?? 0);
    });
  });
}

function extractThumbnail(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({ timestamps: ["2"], filename: "thumb.jpg", folder: join(outputPath, ".."), size: "480x?" })
      .on("end", () => resolve())
      .on("error", reject);
  });
}

function transcodePreview(inputPath: string, outputPath: string, logoUrl: string | null): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath)
      .videoCodec("libx264")
      .size("?x720")
      .outputOptions(["-crf 28", "-preset veryfast"])
      .audioCodec("aac")
      .audioBitrate("96k");

    if (logoUrl) {
      command.complexFilter([
        {
          filter: "drawtext",
          options: {
            text: "souvenir",
            fontcolor: "white@0.6",
            fontsize: 24,
            x: "w-tw-20",
            y: "h-th-20",
          },
        },
      ]);
    }

    command.on("end", () => resolve()).on("error", reject).save(outputPath);
  });
}
