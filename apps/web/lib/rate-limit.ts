import { prisma } from "@/lib/prisma";

/**
 * Limitation de débit — table Postgres, fenêtre glissante (cf.
 * AuthAttempt dans schema.prisma). Chaque appel enregistre une tentative et
 * dit si la limite est atteinte ; à appeler avant l'action sensible
 * (connexion, demande de réinitialisation), pas après.
 */
export async function checkRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number },
): Promise<{ allowed: boolean }> {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.authAttempt.count({ where: { key, createdAt: { gte: since } } });
  if (count >= max) return { allowed: false };
  await prisma.authAttempt.create({ data: { key } });
  return { allowed: true };
}

export function requestIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
