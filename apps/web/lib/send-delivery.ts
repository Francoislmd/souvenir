import type { Delivery, Operator } from "@souvenir/db";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { sendSms } from "./twilio";
import { sendDeliveryEmail } from "./email";
import { getPreviewUrl } from "./storage";
import { env } from "./env";
import { renderDeliveryMessage } from "./message-templates";

interface SendResult {
  emailSent: boolean;
  smsSent: boolean;
  errors: string[];
}

export async function sendDeliveryNotifications(
  delivery: Delivery,
  operator: Operator,
): Promise<SendResult> {
  const galleryUrl = `${env.NEXT_PUBLIC_APP_URL}/g/${delivery.token}`;
  const clientFirstName = (delivery.clientName ?? "").split(/\s+/)[0] ?? "";
  const smsMessage = renderDeliveryMessage(operator.deliveryMessageTemplate, {
    clientName: clientFirstName,
    operatorName: operator.name,
  });

  const result: SendResult = { emailSent: false, smsSent: false, errors: [] };

  if (delivery.clientEmail) {
    try {
      // Fetch session + media for the rich email template
      const [session, mediaCounts, thumbMedia] = await Promise.all([
        prisma.session.findUnique({
          where: { id: delivery.sessionId },
          select: { date: true, mode: true },
        }),
        prisma.media.groupBy({
          by: ["kind"],
          where: { deliveryId: delivery.id, status: "READY" },
          _count: { kind: true },
        }),
        prisma.media.findMany({
          where: { deliveryId: delivery.id, status: "READY", thumbKey: { not: null } },
          select: { thumbKey: true, kind: true },
          orderBy: { kind: "desc" }, // VIDEO before PHOTO alphabetically
          take: 4,
        }),
      ]);

      const photoCount = mediaCounts.find((g) => g.kind === "PHOTO")?._count?.kind ?? 0;
      const videoCount = mediaCounts.find((g) => g.kind === "VIDEO")?._count?.kind ?? 0;
      const thumbUrls = thumbMedia
        .map((m) => (m.thumbKey ? getPreviewUrl(m.thumbKey) : null))
        .filter((u): u is string => u !== null);

      await sendDeliveryEmail({
        to: delivery.clientEmail,
        operatorName: operator.name,
        logoUrl: operator.logoUrl,
        galleryUrl,
        message: smsMessage,
        clientName: delivery.clientName ?? undefined,
        sessionDate: session?.date ?? undefined,
        location: operator.location ?? undefined,
        photoCount,
        videoCount,
        packPriceCents: operator.packPriceCents,
        mode: (session?.mode ?? operator.defaultMode) as "BOUTIQUE" | "MARKETING",
        thumbUrls,
      });
      result.emailSent = true;
      await track("delivery_sent", {
        operatorId: operator.id,
        deliveryId: delivery.id,
        meta: { channel: "email" },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "unknown error";
      console.error("[send-delivery] email error:", msg);
      result.errors.push(`email: ${msg}`);
    }
  }

  if (delivery.clientPhone) {
    try {
      await sendSms(delivery.clientPhone, `${smsMessage}\n${galleryUrl}`);
      result.smsSent = true;
      await track("delivery_sent", {
        operatorId: operator.id,
        deliveryId: delivery.id,
        meta: { channel: "sms" },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "unknown error";
      console.error("[send-delivery] sms error:", msg);
      result.errors.push(`sms: ${msg}`);
    }
  }

  if (result.emailSent || result.smsSent) {
    await prisma.delivery.update({ where: { id: delivery.id }, data: { sentAt: new Date() } });
  }

  return result;
}
