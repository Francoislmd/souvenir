import { prisma } from "./prisma";
import { stripe } from "./stripe";
import { quote, applyReducedOffer, type PricingConfig } from "./pricing";

export class CheckoutError extends Error {
  constructor(public code: "not_found" | "stripe_not_ready" | "already_paid") {
    super(code);
  }
}

export async function createOrUpdatePaymentIntent(params: {
  participantId: string;
  photoIds: string[];
}): Promise<{ clientSecret: string; amountCents: number; stripeAccountId: string }> {
  const participant = await prisma.participant.findUnique({
    where: { id: params.participantId },
    include: { sortie: { include: { operator: true } }, order: true },
  });
  if (!participant || participant.deletedAt) throw new CheckoutError("not_found");

  // Une commande déjà payée ne se rouvre pas. L'upsert ci-dessous repasse le
  // statut à "pending", et lib/gallery.ts n'ouvre la galerie qu'en égalité
  // stricte sur "succeeded" : sans ce garde-fou, un simple rappel de la route
  // reverrouille les photos d'un client qui les a payées. Même raisonnement
  // pour un remboursement ou un litige, dont le statut ne doit pas être
  // écrasé par une nouvelle tentative d'achat.
  if (participant.order && participant.order.status !== "pending" && participant.order.status !== "failed") {
    throw new CheckoutError("already_paid");
  }

  const operator = participant.sortie.operator;
  if (!operator.stripeOnboarded || !operator.stripeAccountId) throw new CheckoutError("stripe_not_ready");
  const stripeAccountId = operator.stripeAccountId;

  const purchasablePhotos = await prisma.photo.findMany({
    where: participant.slotId
      ? { slotId: participant.slotId, hiddenAt: null, status: "READY" }
      : {
          sortieId: participant.sortieId,
          status: "READY",
          OR: [{ ownerId: participant.id }, { ownerId: null }],
        },
    select: { id: true },
  });
  const purchasableIds = new Set(purchasablePhotos.map((p) => p.id));
  // Le pro peut restreindre la vente au pack complet (Réglages) — dans ce
  // cas on ignore la sélection reçue et on facture tout le lot, quoi que le
  // client ait envoyé. C'est la seule application réellement fiable de la
  // règle : la galerie ne fait que refléter ce choix côté UI.
  const selected = operator.packOnly ? Array.from(purchasableIds) : params.photoIds.filter((id) => purchasableIds.has(id));

  const pricing: PricingConfig = {
    pricePhotoCents: operator.pricePhotoCents,
    priceAllCents: operator.priceAllCents,
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

  // Charge directe : le paiement est créé SUR le compte Stripe de
  // l'opérateur, qui est le vendeur (ses CGV, ses remboursements, les frais
  // Stripe à sa charge). Linktrip ne perçoit que `application_fee_amount`.
  // C'est ce qui garde le chiffre d'affaires de la micro-entreprise égal aux
  // seules commissions : avec l'ancienne charge « destination », 100 % du
  // prix des photos transitait par le compte plateforme et comptait comme
  // encaissé par Linktrip (plafond de TVA atteint cinq fois plus vite).
  // Toute lecture ou mise à jour de ce PaymentIntent doit donc passer le même
  // `stripeAccount`, et le navigateur doit charger Stripe.js sur ce compte.
  const onAccount = { stripeAccount: stripeAccountId };

  if (order.stripePi) {
    try {
      const updated = await stripe.paymentIntents.update(
        order.stripePi,
        { amount: amountCents, application_fee_amount: feeCents },
        onAccount,
      );
      if (updated.client_secret) {
        return { clientSecret: updated.client_secret, amountCents, stripeAccountId };
      }
    } catch {
      // PaymentIntent existant non modifiable (déjà confirmé, ou créé sur un
      // autre compte : ancienne plateforme, charge destination) — on en recrée un.
    }
  }

  const intent = await stripe.paymentIntents.create(
    {
      amount: amountCents,
      currency: "eur",
      application_fee_amount: feeCents,
      automatic_payment_methods: { enabled: true },
      metadata: { participantId: participant.id, operatorId: operator.id },
    },
    onAccount,
  );

  await prisma.order.update({ where: { id: order.id }, data: { stripePi: intent.id } });

  if (!intent.client_secret) throw new Error("Stripe did not return a client secret");
  return { clientSecret: intent.client_secret, amountCents, stripeAccountId };
}
