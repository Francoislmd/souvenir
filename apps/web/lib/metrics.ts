import { prisma } from "./prisma";
import { feeKeptCents } from "./fees";

export interface GmvSummary {
  totalCents: number;
  operatorCents: number;
  platformCents: number;
  orderCount: number;
}

export async function getGmv(operatorId: string, since?: Date, until?: Date): Promise<GmvSummary> {
  const orders = await prisma.order.findMany({
    where: {
      participant: { sortie: { operatorId } },
      // Un achat remboursé reste compté, pour ce qu'il en reste : le montant
      // rendu au client sort du total, la commission rendue sort de celle de
      // Linktrip (au prorata, lib/fees.ts).
      status: { in: ["succeeded", "refunded"] },
      ...(since || until ? { paidAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } } : {}),
    },
    select: { amountCents: true, feeCents: true, refundedAmountCents: true },
  });

  let totalCents = 0;
  let platformCents = 0;
  for (const o of orders) {
    totalCents += o.amountCents - o.refundedAmountCents;
    platformCents += feeKeptCents(o.feeCents, o.amountCents, o.refundedAmountCents);
  }
  return { totalCents, operatorCents: totalCents - platformCents, platformCents, orderCount: orders.length };
}

export interface Sale {
  id: string;
  /** succeeded | refunded | disputed */
  status: string;
  refundedCents: number;
  participantName: string;
  activity: string;
  amountCents: number;
  feeCents: number;
  paidAt: Date;
}

export async function getSales(operatorId: string, limit = 30): Promise<Sale[]> {
  const orders = await prisma.order.findMany({
    // Un achat remboursé ou contesté reste dans la liste, avec son statut.
    where: { participant: { sortie: { operatorId } }, status: { in: ["succeeded", "refunded", "disputed"] } },
    include: { participant: { include: { sortie: { select: { activity: true } } } } },
    orderBy: { paidAt: "desc" },
    take: limit,
  });

  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    refundedCents: o.refundedAmountCents,
    participantName: o.participant.name,
    activity: o.participant.sortie.activity,
    amountCents: o.amountCents,
    feeCents: o.feeCents,
    paidAt: o.paidAt ?? o.createdAt,
  }));
}

/** Prochain vendredi (virements hebdomadaires, brief §7). */
export function nextPayoutDate(now: Date = new Date()): Date {
  const d = new Date(now);
  const day = d.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilFriday);
  return d;
}
