import type { DeliveryStatus, EventName } from "@souvenir/db";
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

async function countDistinctDeliveries(operatorId: string, name: EventName): Promise<number> {
  const rows = await prisma.event.findMany({
    where: { operatorId, name, deliveryId: { not: null } },
    select: { deliveryId: true },
    distinct: ["deliveryId"],
  });
  return rows.length;
}

export async function getFunnel(operatorId: string): Promise<FunnelStep[]> {
  // Le scan ouvre directement la galerie : "récupérée" et "ouverte" sont
  // désormais le même événement (1ère ouverture = claim).
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
  const orders = await prisma.order.findMany({
    where: { delivery: { session: { operatorId } }, status: "succeeded" },
    select: { amountCents: true, feeCents: true },
  });

  const totalCents = orders.reduce((sum, order) => sum + order.amountCents, 0);
  const souvenirCents = orders.reduce((sum, order) => sum + order.feeCents, 0);
  const operatorCents = totalCents - souvenirCents;
  const orderCount = orders.length;
  const averageCents = orderCount > 0 ? Math.round(totalCents / orderCount) : 0;

  return { totalCents, operatorCents, souvenirCents, averageCents, orderCount };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export async function getMedianClaimDelaySec(operatorId: string): Promise<number | null> {
  const deliveries = await prisma.delivery.findMany({
    where: { session: { operatorId }, claimedAt: { not: null } },
    select: { createdAt: true, claimedAt: true },
  });

  const delays = deliveries
    .map((delivery) => (delivery.claimedAt!.getTime() - delivery.createdAt.getTime()) / 1000)
    .filter((delay) => delay >= 0);

  return median(delays);
}

export async function getMedianPurchaseDelaySec(operatorId: string): Promise<number | null> {
  const deliveries = await prisma.delivery.findMany({
    where: { session: { operatorId }, claimedAt: { not: null }, order: { isNot: null } },
    select: { claimedAt: true, order: { select: { createdAt: true } } },
  });

  const delays = deliveries
    .map((delivery) => (delivery.order!.createdAt.getTime() - delivery.claimedAt!.getTime()) / 1000)
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

  return deliveries.map((delivery) => ({
    id: delivery.id,
    code: delivery.code,
    clientName: delivery.clientName,
    clientEmail: delivery.clientEmail,
    status: delivery.status,
    amountCents: delivery.order?.amountCents ?? null,
    createdAt: delivery.createdAt,
  }));
}
