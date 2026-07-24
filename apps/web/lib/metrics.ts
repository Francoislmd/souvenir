import { prisma } from "./prisma";

export interface GmvSummary {
  totalCents: number;
  operatorCents: number;
  platformCents: number;
  orderCount: number;
}

export async function getGmv(operatorId: string, since?: Date): Promise<GmvSummary> {
  const agg = await prisma.order.aggregate({
    where: {
      participant: { sortie: { operatorId } },
      status: "succeeded",
      ...(since ? { paidAt: { gte: since } } : {}),
    },
    _sum: { amountCents: true, feeCents: true },
    _count: true,
  });

  const totalCents = agg._sum.amountCents ?? 0;
  const platformCents = agg._sum.feeCents ?? 0;
  return { totalCents, operatorCents: totalCents - platformCents, platformCents, orderCount: agg._count };
}

export interface Sale {
  id: string;
  participantName: string;
  activity: string;
  amountCents: number;
  feeCents: number;
  paidAt: Date;
}

export async function getSales(operatorId: string, limit = 30): Promise<Sale[]> {
  const orders = await prisma.order.findMany({
    where: { participant: { sortie: { operatorId } }, status: "succeeded" },
    include: { participant: { include: { sortie: { select: { activity: true } } } } },
    orderBy: { paidAt: "desc" },
    take: limit,
  });

  return orders.map((o) => ({
    id: o.id,
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
