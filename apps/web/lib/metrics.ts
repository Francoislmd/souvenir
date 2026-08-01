import { prisma } from "./prisma";
import { startOfMonth, daysAgo } from "./dates";

export interface GmvSummary {
  totalCents: number;
  operatorCents: number;
  platformCents: number;
  orderCount: number;
}

export async function getGmv(operatorId: string, since?: Date, until?: Date): Promise<GmvSummary> {
  const agg = await prisma.order.aggregate({
    where: {
      participant: { sortie: { operatorId } },
      status: "succeeded",
      ...(since || until ? { paidAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } } : {}),
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

export interface SortiesKpis {
  revenueCents: number;
  previousRevenueCents: number;
  sortieCount: number;
  participantCount: number;
  photosSoldCount: number;
  photosSoldThisWeek: number;
  buyerCount: number;
  purchaseRatePercent: number;
}

/** KPIs de la page Sorties — tous scopés au mois en cours (sauf le delta hebdo photos). */
export async function getSortiesKpis(operatorId: string, now: Date = new Date()): Promise<SortiesKpis> {
  const monthStart = startOfMonth(now);
  const previousMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const weekStart = daysAgo(now, 7);

  const [revenue, previousRevenue, sorties, ordersThisMonth, ordersThisWeek] = await Promise.all([
    getGmv(operatorId, monthStart),
    getGmv(operatorId, previousMonthStart, monthStart),
    prisma.sortie.findMany({
      where: { operatorId, startsAt: { gte: monthStart } },
      select: { _count: { select: { participants: true } } },
    }),
    prisma.order.findMany({
      where: { participant: { sortie: { operatorId, startsAt: { gte: monthStart } } }, status: "succeeded" },
      select: { photoIds: true, participantId: true },
    }),
    prisma.order.findMany({
      where: { participant: { sortie: { operatorId } }, status: "succeeded", paidAt: { gte: weekStart } },
      select: { photoIds: true },
    }),
  ]);

  const participantCount = sorties.reduce((sum, s) => sum + s._count.participants, 0);
  const photosSoldCount = ordersThisMonth.reduce((sum, o) => sum + o.photoIds.length, 0);
  const photosSoldThisWeek = ordersThisWeek.reduce((sum, o) => sum + o.photoIds.length, 0);
  const buyerCount = new Set(ordersThisMonth.map((o) => o.participantId)).size;

  return {
    revenueCents: revenue.operatorCents,
    previousRevenueCents: previousRevenue.operatorCents,
    sortieCount: sorties.length,
    participantCount,
    photosSoldCount,
    photosSoldThisWeek,
    buyerCount,
    purchaseRatePercent: participantCount > 0 ? Math.round((buyerCount / participantCount) * 100) : 0,
  };
}

/** Prochain vendredi (virements hebdomadaires, brief §7). */
export function nextPayoutDate(now: Date = new Date()): Date {
  const d = new Date(now);
  const day = d.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilFriday);
  return d;
}
