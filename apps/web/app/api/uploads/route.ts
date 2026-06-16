import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { track } from "@/lib/analytics";

const schema = z
  .object({
    deliveryId: z.string().min(1).optional(),
    batchId: z.string().min(1).optional(),
    kind: z.enum(["PHOTO", "VIDEO"]),
    filename: z.string().min(1),
  })
  .refine((data) => Boolean(data.deliveryId) !== Boolean(data.batchId), {
    message: "Indique soit deliveryId, soit batchId.",
  });

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const { deliveryId, batchId, kind, filename } = parsed.data;

    let operatorId: string;
    const ownerId = (deliveryId ?? batchId) as string;

    if (deliveryId) {
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: { session: true },
      });
      if (!delivery) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
      operatorId = delivery.session.operatorId;
    } else {
      const batch = await prisma.importBatch.findUnique({
        where: { id: batchId },
        include: { session: true },
      });
      if (!batch) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
      operatorId = batch.session.operatorId;
    }

    // Le nom de fichier d'origine peut contenir des accents/caractères spéciaux
    // (ex: "Capture d'écran à 11.12.03.png") qui cassent l'URL signée une fois
    // injectés tels quels dans la clé de stockage. On ne garde que l'extension.
    const extensionMatch = /\.([a-zA-Z0-9]+)$/.exec(filename);
    const extension = extensionMatch ? `.${extensionMatch[1].toLowerCase()}` : "";
    const originalKey = `${ownerId}/${crypto.randomUUID()}${extension}`;

    const { data, error } = await supabaseAdmin.storage
      .from("originals")
      .createSignedUploadUrl(originalKey);

    if (error || !data) {
      throw error ?? new Error("Failed to create signed upload URL");
    }

    const media = await prisma.media.create({
      data: {
        kind,
        originalKey,
        status: "UPLOADED",
        ...(deliveryId ? { deliveryId } : { importBatchId: batchId }),
      },
    });

    await track("media_uploaded", {
      operatorId,
      ...(deliveryId ? { deliveryId } : {}),
      meta: { mediaId: media.id, kind },
    });

    return Response.json(
      { mediaId: media.id, signedUrl: data.signedUrl, path: data.path, token: data.token },
      { status: 201 },
    );
  } catch (error) {
    console.error("[API /api/uploads]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
