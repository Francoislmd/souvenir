import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { sendDeliveryNotifications } from "@/lib/send-delivery";
import { toE164 } from "@/lib/phone";

const schema = z.object({
  clientName: z.string().min(1).nullable().optional(),
  clientEmail: z.string().email().nullable().optional(),
  clientPhone: z.string().min(1).nullable().optional(),
  title: z.string().min(1).nullable().optional(),
});

export async function POST(request: Request, { params }: { params: { deliveryId: string } }): Promise<Response> {
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

    const delivery = await prisma.delivery.findFirst({
      where: { id: params.deliveryId, session: { operatorId: dbUser.operatorId } },
    });
    if (!delivery) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (!parsed.data.clientEmail && !parsed.data.clientPhone && !delivery.clientEmail && !delivery.clientPhone) {
      return Response.json({ error: "Indique au moins un email ou un numéro de téléphone." }, { status: 400 });
    }

    const updated = await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        ...(parsed.data.clientName !== undefined ? { clientName: parsed.data.clientName } : {}),
        ...(parsed.data.clientEmail !== undefined ? { clientEmail: parsed.data.clientEmail } : {}),
        ...(parsed.data.clientPhone !== undefined
          ? { clientPhone: parsed.data.clientPhone ? toE164(parsed.data.clientPhone) : null }
          : {}),
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      },
    });

    const result = await sendDeliveryNotifications(updated, dbUser.operator);

    if (!result.emailSent && !result.smsSent) {
      return Response.json({ error: "L'envoi a échoué.", details: result.errors }, { status: 502 });
    }

    return Response.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    console.error("[API /api/deliveries/[deliveryId]/send]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
