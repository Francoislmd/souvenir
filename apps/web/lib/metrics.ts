import type { DeliveryStatus } from "@souvenir/db";
import { prisma } from "./prisma";

export interface AttachRate {
  rate: number;
  purchases: number;
  claims: number;
}

export async function getAttachRate(operatorId: string): Promise<AttachRate> {
  const [claims, purchases] = await Promise.all([
    prisma.delivery.count({ where: { session: { operatorId }, claimedAt: { not: null } } }),
    prisma.delivery.count({ where: { session: { operatorId }, status: "PURCHASED" } }),
  ]);

  return { rate: claims > 0 ? purchases / claims : 0, purchases, claims };
}

export interface FunnelStep {
  name: string;
  count: number;
}

// COUNT(DISTINCT) en SQL — évite de charger toutes les lignes en mémoire.
async function countDistinctDeliveries(operatorId: string, name: string): Promise<number> {
  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(DISTINCT "deliveryId") as count
    FROM "Event"
    WHERE "operatorId" = ${operatorId}
      AND name = ${name}
      AND "deliveryId" IS NOT NULL
  `;
  return Number(result[0]?.count ?? 0);
}

export async function getFunnel(operatorId: string): Promise<FunnelStep[]> {
  const [created, opened, checkout, paid] = await Promise.all([
    prisma.delivery.count({ where: { session: { operatorId } } }),
    prisma.delivery.count({ where: { session: { operatorId }, claimedAt: { not: null } } }),
    countDistinctDeliveries(operatorId, "checkout_started"),
    countDistinctDeliveries(operatorId, "purchase_succeeded"),
  ]);

  return [
    { name: "Créées", count: created },
    { name: "Ouvertes", count: opened },
    { name: "Checkout", count: checkout },
    { name: "Payées", count: paid },
  ];
}

export interface GmvSummary {
  totalCents: number;
  operatorCents: number;
  souvenirCents: number;
  averageCents: number;
  orderCount: number;
}

export async function getGmv(operatorId: string): Promise<GmvSummary> {
  const agg = await prisma.order.aggregate({
    where: { delivery: { session: { operatorId } }, status: "succeeded" },
    _sum: { amountCents: true, feeCents: true },
    _count: true,
  });

  const totalCents = agg._sum.amountCents ?? 0;
  const souvenirCents = agg._sum.feeCents ?? 0;
  const operatorCents = totalCents - souvenirCents;
  const orderCount = agg._count;
  const averageCents = orderCount > 0 ? Math.round(totalCents / orderCount) : 0;

  return { totalCents, operatorCents, souvenirCents, averageCents, orderCount };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

export async function getMedianClaimDelaySec(operatorId: string): Promise<number | null> {
  const deliveries = await prisma.delivery.findMany({
    where: { session: { operatorId }, claimedAt: { not: null } },
    select: { createdAt: true, claimedAt: true },
  });

  const delays = deliveries
    .map((d) => (d.claimedAt!.getTime() - d.createdAt.getTime()) / 1000)
    .filter((delay) => delay >= 0);

  return median(delays);
}

export async function getMedianPurchaseDelaySec(operatorId: string): Promise<number | null> {
  const deliveries = await prisma.delivery.findMany({
    where: { session: { operatorId }, claimedAt: { not: null }, order: { isNot: null } },
    select: { claimedAt: true, order: { select: { createdAt: true } } },
  });

  const delays = deliveries
    .map((d) => (d.order!.createdAt.getTime() - d.claimedAt!.getTime()) / 1000)
    .filter((delay) => delay >= 0);

  return median(delays);
}

export interface RecentDelivery {
  id: string;
  code: string;
  clientName: string | null;
  clientEmail: string | null;
  status: DeliveryStatus;
  amountCents: number | null;
  createdAt: Date;
}

export async function getRecentDeliveries(operatorId: string, limit = 6): Promise<RecentDelivery[]> {
  const deliveries = await prisma.delivery.findMany({
    where: { session: { operatorId } },
    include: { order: { select: { amountCents: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return deliveries.map((d) => ({
    id: d.id,
    code: d.code,
    clientName: d.clientName,
    clientEmail: d.clientEmail,
    status: d.status,
    amountCents: d.order?.amountCents ?? null,
    createdAt: d.createdAt,
  }));
}
