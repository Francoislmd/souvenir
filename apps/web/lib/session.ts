import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/dates";
import type { Operator, Session } from "@souvenir/db";

/** Renvoie la session du jour de l'opérateur, ou la crée si elle n'existe pas. */
export async function getOrCreateTodaySession(operator: Operator): Promise<Session> {
  const now = new Date();

  const existing = await prisma.session.findFirst({
    where: { operatorId: operator.id, date: { gte: startOfDay(now), lte: endOfDay(now) } },
    orderBy: { date: "desc" },
  });

  if (existing) return existing;

  return prisma.session.create({
    data: { operatorId: operator.id, mode: operator.defaultMode },
  });
}
