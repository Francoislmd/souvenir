import { prisma } from "./prisma";
import { stripe } from "./stripe";
import { quote, applyReducedOffer, type PricingConfig } from "./pricing";
import { accessFromOrders, remainingCapCents, visiblePhotoWhere } from "./access";
import { ensurePaymentDomains } from "./payment-domains";

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
    include: { sortie: { include: { operator: true } }, orders: true },
  });
  if (!participant || participant.deletedAt) throw new CheckoutError("not_found");

  const operator = participant.sortie.operator;
  if (!operator.stripeOnboarded || !operator.stripeAccountId) throw new CheckoutError("stripe_not_ready");
  const stripeAccountId = operator.stripeAccountId;

  // Plusieurs commandes par client (galerie privée) : ce qui est déjà payé
  // n'est ni revendu ni recompté, et le prix du lot est un plafond qui court
  // d'une commande à l'autre (lib/access.ts).
  const access = accessFromOrders(participant.orders, operator.priceAllCents);
  if (access.packReached) throw new CheckoutError("already_paid");

  const purchasablePhotos = await prisma.photo.findMany({
    // Seules les photos traitées s'achètent ; le statut écrase celui de visiblePhotoWhere.
    where: { ...visiblePhotoWhere(participant), status: "READY" },
    select: { id: true },
  });
  const remainingIds = purchasablePhotos.map((p) => p.id).filter((id) => !access.ids.has(id));
  const remaining = new Set(remainingIds);
  if (remaining.size === 0) throw new CheckoutError("already_paid");

  // Le pro peut restreindre la vente au pack complet (Réglages) — dans ce
  // cas on ignore la sélection reçue et on facture tout ce qui reste, quoi
  // que le client ait envoyé. C'est la seule application réellement fiable
  // de la règle : la galerie ne fait que refléter ce choix côté UI.
  const selected = operator.packOnly ? remainingIds : params.photoIds.filter((id) => remaining.has(id));

  const capCents = remainingCapCents(access, operator.priceAllCents);
  const pricing: PricingConfig = { pricePhotoCents: operator.pricePhotoCents, priceAllCents: capCents };
  const q = quote(selected.length, remaining.size, pricing);
  const offerActive = !!participant.reducedOfferExpiresAt && participant.reducedOfferExpiresAt > new Date();
  const amountCents = offerActive ? applyReducedOffer(q.totalCents) : q.totalCents;
  const feeCents = Math.round((amountCents * operator.feePercent) / 100);

  if (amountCents <= 0) throw new CheckoutError("not_found");

  // La commande complète le lot si elle prend tout ce qui reste, ou si, avec
  // ce qui est déjà payé, elle atteint le prix du lot.
  const isPack = selected.length >= remaining.size || q.totalCents >= capCents;

  // Une commande ouverte (pas encore payée) se reprend ; une commande payée,
  // remboursée ou en litige ne se rouvre jamais : son statut ne doit pas être
  // écrasé par une nouvelle tentative d'achat. lib/gallery.ts n'ouvre l'accès
  // qu'en égalité stricte sur "succeeded".
  const open = participant.orders
    .filter((o) => o.status === "pending" || o.status === "failed")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const order = open
    ? await prisma.order.update({ where: { id: open.id }, data: { photoIds: selected, amountCents, feeCents, isPack, status: "pending" } })
    : await prisma.order.create({ data: { participantId: participant.id, photoIds: selected, amountCents, feeCents, isPack, status: "pending" } });

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

  // Apple Pay et Google Pay ne s'affichent que sur un domaine enregistré sur
  // le compte de l'opérateur : on le vérifie avant de rendre le clientSecret.
  await ensurePaymentDomains(stripeAccountId);

  // Carte uniquement : Apple Pay et Google Pay passent par le type « card »
  // (ce sont des portefeuilles de cartes). Pas de Link, PayPal, Klarna ni
  // virement, quel que soit le réglage du compte Stripe de l'opérateur.
  const paymentMethodTypes = ["card"];

  if (order.stripePi) {
    try {
      const updated = await stripe.paymentIntents.update(
        order.stripePi,
        { amount: amountCents, application_fee_amount: feeCents, payment_method_types: paymentMethodTypes },
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
      payment_method_types: paymentMethodTypes,
      metadata: { participantId: participant.id, operatorId: operator.id },
    },
    onAccount,
  );

  await prisma.order.update({ where: { id: order.id }, data: { stripePi: intent.id } });

  if (!intent.client_secret) throw new Error("Stripe did not return a client secret");
  return { clientSecret: intent.client_secret, amountCents, stripeAccountId };
}
