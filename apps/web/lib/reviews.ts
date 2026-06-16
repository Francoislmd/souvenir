import type { Delivery, Operator, Session } from "@souvenir/db";
import { prisma } from "./prisma";
import { sendWhatsAppMessage } from "./twilio";
import { track } from "./analytics";

const REVIEW_WINDOW_MS = 24 * 60 * 60 * 1000;

type DeliveryWithOperator = Delivery & { session: Session & { operator: Operator } };

export async function maybeSendReviewMessage(delivery: DeliveryWithOperator): Promise<void> {
  if (delivery.reviewSentAt) return;
  if (!delivery.clientPhone) return;

  const isMarketing = delivery.session.mode === "MARKETING";
  if (!isMarketing && delivery.status !== "PURCHASED") return;

  const operator = delivery.session.operator;
  const withinWindow =
    !!delivery.whatsappOptInAt && Date.now() - delivery.whatsappOptInAt.getTime() < REVIEW_WINDOW_MS;

  if (withinWindow && operator.googleReviewUrl) {
    await sendWhatsAppMessage(
      delivery.clientPhone,
      `Si le vol t'a plu, 30 secondes pour aider ${operator.name} : ${operator.googleReviewUrl}`,
    );
  } else {
    await track("review_window_missed", { operatorId: operator.id, deliveryId: delivery.id });
  }

  await prisma.delivery.update({ where: { id: delivery.id }, data: { reviewSentAt: new Date() } });
}
