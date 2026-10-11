import { prisma } from "./prisma";

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
      // Un achat remboursé reste compté : le client a récupéré son argent,
      // mais la commission n'est pas rendue, elle reste à la charge du pro.
      status: { in: ["succeeded", "refunded"] },
      ...(since || until ? { paidAt: { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } } : {}),
    },
    _sum: { amountCents: true, feeCents: true, refundedAmountCents: true },
    _count: true,
  });

  // Un remboursement partiel laisse la commande « succeeded » : ce qui a été
  // rendu au client sort du total. La commission, elle, n'est pas rendue.
  const totalCents = (agg._sum.amountCents ?? 0) - (agg._sum.refundedAmountCents ?? 0);
  const platformCents = agg._sum.feeCents ?? 0;
  return { totalCents, operatorCents: totalCents - platformCents, platformCents, orderCount: agg._count };
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
