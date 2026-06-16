import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import archiver from "archiver";
import { prisma } from "@souvenir/db";
import { supabaseAdmin, ORIGINALS_BUCKET } from "../lib/supabase.js";

interface ProcessZipParams {
  mediaId: string;
}

export async function processZipJob({ mediaId }: ProcessZipParams): Promise<void> {
  const media = await prisma.media.findUniqueOrThrow({ where: { id: mediaId } });
  const deliveryId = media.deliveryId;

  const allMedia = await prisma.media.findMany({ where: { deliveryId } });

  const dir = await mkdtemp(join(tmpdir(), "souvenir-zip-"));
  try {
    const zipPath = join(dir, "archive.zip");
    await buildZip(allMedia, zipPath);

    const zipBuffer = await readFile(zipPath);
    const zipKey = `zips/${deliveryId}.zip`;

    const { error } = await supabaseAdmin.storage
      .from(ORIGINALS_BUCKET)
      .upload(zipKey, zipBuffer, { contentType: "application/zip", upsert: true });
    if (error) throw error;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function buildZip(media: { originalKey: string }[], zipPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", reject);
    archive.pipe(output);

    void (async () => {
      for (const item of media) {
        const { data, error } = await supabaseAdmin.storage.from(ORIGINALS_BUCKET).download(item.originalKey);
        if (error || !data) continue;
        const buffer = Buffer.from(await data.arrayBuffer());
        const tmpFile = join(zipPath, "..", item.originalKey.replace(/\//g, "_"));
        await writeFile(tmpFile, buffer);
        archive.file(tmpFile, { name: item.originalKey.split("/").pop() ?? item.originalKey });
      }
      await archive.finalize();
    })();
  });
}
