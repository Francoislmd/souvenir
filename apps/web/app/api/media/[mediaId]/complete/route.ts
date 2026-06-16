import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  sizeBytes: z.number().int().positive(),
});

export async function POST(request: Request, { params }: { params: { mediaId: string } }): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const media = await prisma.media.findUnique({ where: { id: params.mediaId } });
    if (!media) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.media.update({
      where: { id: media.id },
      data: { sizeBytes: parsed.data.sizeBytes },
    });

    await prisma.processingJob.create({
      data: { mediaId: media.id, kind: "preview" },
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/media/[mediaId]/complete]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
