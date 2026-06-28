import type { Delivery, Operator } from "@souvenir/db";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { sendSms } from "./twilio";
import { sendDeliveryEmail } from "./email";
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
      await sendDeliveryEmail({
        to: delivery.clientEmail,
        operatorName: operator.name,
        logoUrl: operator.logoUrl,
        galleryUrl,
        message: smsMessage,
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
