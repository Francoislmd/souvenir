import { redirect } from "next/navigation";
import { createClient } from "./supabase-server";
import { prisma } from "./prisma";
import type { Operator, User } from "@souvenir/db";

export type OperatorUser = User & { operator: Operator };

/** Server Components only — redirige si pas connecté / pas onboardé. */
export async function requireOperatorUser(): Promise<OperatorUser> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { operator: true },
  });

  if (!dbUser) redirect("/onboarding");

  return dbUser;
}

/** Server Components only — comme requireOperatorUser, mais réservé aux ADMIN. */
export async function requireAdminUser(): Promise<OperatorUser> {
  const dbUser = await requireOperatorUser();
  if (dbUser.role !== "ADMIN") redirect("/sessions");
  return dbUser;
}

/** Route Handlers — renvoie null au lieu de rediriger (à traiter en 401/403). */
export async function getOperatorUser(): Promise<OperatorUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  return prisma.user.findUnique({
    where: { email: user.email },
    include: { operator: true },
  });
}
