import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { getPreviewUrl } from "@/lib/storage";
import { track } from "@/lib/analytics";
import { getOperatorUser } from "@/lib/current-user";

const schema = z.object({
  filename: z.string().min(1),
});

export async function GET(_request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sortie = await prisma.sortie.findFirst({ where: { id: params.sortieId, operatorId: dbUser.operatorId } });
  if (!sortie) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const photos = await prisma.photo.findMany({
    where: { sortieId: sortie.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true, ownerId: true, isFreeSample: true, thumbKey: true },
  });

  return Response.json({
    photos: photos.map((p) => ({
      id: p.id,
      status: p.status,
      ownerId: p.ownerId,
      isFreeSample: p.isFreeSample,
      thumbUrl: p.thumbKey ? getPreviewUrl(p.thumbKey) : null,
    })),
  });
}

export async function POST(request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const sortie = await prisma.sortie.findFirst({
      where: { id: params.sortieId, operatorId: dbUser.operatorId },
    });
    if (!sortie) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const extensionMatch = /\.([a-zA-Z0-9]+)$/.exec(parsed.data.filename);
    const extension = extensionMatch ? `.${extensionMatch[1].toLowerCase()}` : "";
    const originalKey = `${sortie.id}/${crypto.randomUUID()}${extension}`;

    const { data, error } = await supabaseAdmin.storage.from("originals").createSignedUploadUrl(originalKey);
    if (error || !data) {
      throw error ?? new Error("Failed to create signed upload URL");
    }

    const photo = await prisma.photo.create({
      data: { sortieId: sortie.id, originalKey, status: "UPLOADED" },
    });

    await track("photos_uploaded", { operatorId: dbUser.operatorId, meta: { photoId: photo.id } });

    return Response.json({ photoId: photo.id, signedUrl: data.signedUrl }, { status: 201 });
  } catch (error) {
    console.error("[API /api/sorties/[sortieId]/photos]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
