import type Stripe from "stripe";
import { prisma } from "./prisma";
import { stripe } from "./stripe";
import { sellerFromOperator, type Seller } from "./seller-format";

/**
 * Le détail d'un achat pour l'écran Revenus : ce que le client a payé, ce que
 * Linktrip a prélevé, ce que Stripe a pris, ce qui revient au pro.
 *
 * En charge directe (lib/checkout.ts), les frais Stripe sont à la charge du
 * pro et ne sont pas en base : on les lit dans la transaction du compte
 * connecté. Stripe injoignable ou paiement sans transaction (test) : `stripe`
 * vaut null et l'écran le dit, sans chiffre inventé.
 */
export interface SaleDetail {
  id: string;
  ref: string; // « SV-1A2B3C », la référence des e-mails et reçus
  status: string;
  amountCents: number;
  feeCents: number;
  refundedCents: number;
  disputeStatus: string | null;
  paidAt: Date;
  refundedAt: Date | null;
  isPack: boolean;
  itemCount: number;
  videoCount: number;
  client: { name: string; contact: string };
  sortie: { id: string; activity: string; place: string | null; startsAt: Date };
  slotLabel: string | null;
  stripePi: string | null;
  seller: Seller;
  stripe: {
    feeCents: number;
    availableOn: Date | null;
    method: string | null;
  } | null;
}

const WALLETS: Record<string, string> = { apple_pay: "Apple Pay", google_pay: "Google Pay", link: "Link" };

function methodLabel(charge: Stripe.Charge): string | null {
  const d = charge.payment_method_details;
  if (!d) return null;
  if (d.type === "card" && d.card) {
    const wallet = d.card.wallet?.type ? WALLETS[d.card.wallet.type] : undefined;
    if (wallet) return wallet;
    const brand = d.card.brand ? d.card.brand.charAt(0).toUpperCase() + d.card.brand.slice(1) : "Carte";
    return d.card.last4 ? `${brand} •••• ${d.card.last4}` : brand;
  }
  if (d.type === "link") return "Link";
  return d.type.replace(/_/g, " ");
}

async function readStripe(pi: string, account: string): Promise<SaleDetail["stripe"]> {
  try {
    const intent = await stripe.paymentIntents.retrieve(
      pi,
      { expand: ["latest_charge.balance_transaction"] },
      { stripeAccount: account, timeout: 5000 },
    );
    const charge = intent.latest_charge && typeof intent.latest_charge === "object" ? intent.latest_charge : null;
    const bt = charge?.balance_transaction && typeof charge.balance_transaction === "object" ? charge.balance_transaction : null;
    if (!charge || !bt) return null;
    const feeCents = bt.fee_details.filter((f) => f.type === "stripe_fee").reduce((sum, f) => sum + f.amount, 0);
    return {
      feeCents,
      availableOn: bt.available_on ? new Date(bt.available_on * 1000) : null,
      method: methodLabel(charge),
    };
  } catch (error) {
    console.error("[sale-detail] Stripe injoignable", error);
    return null;
  }
}

export async function getSaleDetail(operatorId: string, orderId: string): Promise<SaleDetail | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, participant: { sortie: { operatorId } } },
    include: {
      participant: {
        select: {
          name: true,
          contact: true,
          slot: { select: { label: true } },
          sortie: {
            select: {
              id: true,
              activity: true,
              place: true,
              startsAt: true,
              operator: {
                select: {
                  name: true,
                  legalName: true,
                  legalAddress: true,
                  siret: true,
                  vatExempt: true,
                  stripeAccountId: true,
                  users: { where: { role: "ADMIN" }, orderBy: { createdAt: "asc" }, take: 1, select: { email: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!order) return null;

  const { participant } = order;
  const { sortie } = participant;
  const operator = sortie.operator;

  const [videoCount, stripeInfo] = await Promise.all([
    order.photoIds.length > 0 ? prisma.photo.count({ where: { id: { in: order.photoIds }, isVideo: true } }) : Promise.resolve(0),
    order.stripePi && operator.stripeAccountId ? readStripe(order.stripePi, operator.stripeAccountId) : Promise.resolve(null),
  ]);

  return {
    id: order.id,
    ref: `SV-${order.id.slice(-6).toUpperCase()}`,
    status: order.status,
    amountCents: order.amountCents,
    feeCents: order.feeCents,
    refundedCents: order.refundedAmountCents,
    disputeStatus: order.disputeStatus,
    paidAt: order.paidAt ?? order.createdAt,
    refundedAt: order.refundedAt,
    isPack: order.isPack,
    itemCount: order.photoIds.length,
    videoCount,
    client: { name: participant.name, contact: participant.contact },
    sortie: { id: sortie.id, activity: sortie.activity, place: sortie.place, startsAt: sortie.startsAt },
    slotLabel: participant.slot?.label ?? null,
    stripePi: order.stripePi,
    seller: sellerFromOperator(operator, operator.users[0]?.email ?? null),
    stripe: stripeInfo,
  };
}
