import { prisma } from "./prisma";
import { stripe } from "./stripe";
import { quote, applyReducedOffer, type PricingConfig } from "./pricing";

export class CheckoutError extends Error {
  constructor(public code: "not_found" | "stripe_not_ready") {
    super(code);
  }
}

export async function createOrUpdatePaymentIntent(params: {
  participantId: string;
  photoIds: string[];
}): Promise<{ clientSecret: string; amountCents: number }> {
  const participant = await prisma.participant.findUnique({
    where: { id: params.participantId },
    include: { sortie: { include: { operator: true } }, order: true },
  });
  if (!participant || participant.deletedAt) throw new CheckoutError("not_found");

  const operator = participant.sortie.operator;
  if (!operator.stripeOnboarded || !operator.stripeAccountId) throw new CheckoutError("stripe_not_ready");

  const purchasablePhotos = await prisma.photo.findMany({
    where: {
      sortieId: participant.sortieId,
      status: "READY",
      isFreeSample: false,
      OR: [{ ownerId: participant.id }, { ownerId: null }],
    },
    select: { id: true },
  });
  const purchasableIds = new Set(purchasablePhotos.map((p) => p.id));
  const selected = params.photoIds.filter((id) => purchasableIds.has(id));

  const pricing: PricingConfig = {
    pricePhotoCents: operator.pricePhotoCents,
    pricePackCents: operator.pricePackCents,
    priceAllCents: operator.priceAllCents,
    packSize: operator.packSize,
  };

  const q = quote(selected.length, purchasableIds.size, pricing);
  const offerActive = !!participant.reducedOfferExpiresAt && participant.reducedOfferExpiresAt > new Date();
  const amountCents = offerActive ? applyReducedOffer(q.totalCents) : q.totalCents;
  const feeCents = Math.round((amountCents * operator.feePercent) / 100);

  if (amountCents <= 0) throw new CheckoutError("not_found");

  const order = await prisma.order.upsert({
    where: { participantId: participant.id },
    update: { photoIds: selected, amountCents, feeCents, status: "pending" },
    create: { participantId: participant.id, photoIds: selected, amountCents, feeCents, status: "pending" },
  });

  if (order.stripePi) {
    try {
      const updated = await stripe.paymentIntents.update(order.stripePi, {
        amount: amountCents,
        application_fee_amount: feeCents,
      });
      if (updated.client_secret) {
        return { clientSecret: updated.client_secret, amountCents };
      }
    } catch {
      // PaymentIntent existant non modifiable (déjà confirmé…) — on en recrée un.
    }
  }

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "eur",
    application_fee_amount: feeCents,
    transfer_data: { destination: operator.stripeAccountId },
    automatic_payment_methods: { enabled: true },
    metadata: { participantId: participant.id },
  });

  await prisma.order.update({ where: { id: order.id }, data: { stripePi: intent.id } });

  if (!intent.client_secret) throw new Error("Stripe did not return a client secret");
  return { clientSecret: intent.client_secret, amountCents };
}
