import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getOperatorUser } from "@/lib/current-user";
import { generateUniqueCode } from "@/lib/delivery-code";
import { sendDeliveryNotifications } from "@/lib/send-delivery";
import { toE164 } from "@/lib/phone";

const schema = z.object({
  groups: z
    .array(
      z.object({
        mediaIds: z.array(z.string().min(1)).min(1),
        clientName: z.string().min(1).nullable().optional(),
        clientEmail: z.string().email().nullable().optional(),
        clientPhone: z.string().min(1).nullable().optional(),
        title: z.string().min(1).nullable().optional(),
      }),
    )
    .min(1),
});

export async function POST(request: Request, { params }: { params: { batchId: string } }): Promise<Response> {
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

    const { operator } = dbUser;

    const batch = await prisma.importBatch.findFirst({
      where: { id: params.batchId, session: { operatorId: operator.id } },
      include: { media: { select: { id: true } } },
    });
    if (!batch) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const batchMediaIds = new Set(batch.media.map((media) => media.id));

    const deliveries: { id: string; code: string; clientName: string | null; emailSent: boolean; smsSent: boolean; sendErrors: string[] }[] = [];

    for (const group of parsed.data.groups) {
      const mediaIds = group.mediaIds.filter((id) => batchMediaIds.has(id));
      if (mediaIds.length === 0) continue;

      const code = await generateUniqueCode();

      const delivery = await prisma.delivery.create({
        data: {
          sessionId: batch.sessionId,
          code,
          token: crypto.randomUUID(),
          clientName: group.clientName ?? null,
          clientEmail: group.clientEmail ?? null,
          clientPhone: group.clientPhone ? toE164(group.clientPhone) : null,
          title: group.title ?? null,
        },
      });

      await prisma.media.updateMany({
        where: { id: { in: mediaIds }, importBatchId: batch.id },
        data: { deliveryId: delivery.id, importBatchId: null },
      });

      await track("delivery_created", { operatorId: operator.id, deliveryId: delivery.id });

      let emailSent = false;
      let smsSent = false;
      let sendErrors: string[] = [];
      if (delivery.clientEmail || delivery.clientPhone) {
        const sendResult = await sendDeliveryNotifications(delivery, operator);
        emailSent = sendResult.emailSent;
        smsSent = sendResult.smsSent;
        sendErrors = sendResult.errors;
      }

      deliveries.push({ id: delivery.id, code: delivery.code, clientName: delivery.clientName, emailSent, smsSent, sendErrors });
    }

    await prisma.importBatch.update({ where: { id: batch.id }, data: { status: "done" } });

    return Response.json({ deliveries }, { status: 200 });
  } catch (error) {
    console.error("[API /api/import-batches/[batchId]/finalize]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
