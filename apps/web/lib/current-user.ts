import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase-server";
import { prisma } from "./prisma";
import type { Operator, User } from "@souvenir/db";

export type OperatorUser = User & { operator: Operator };

// Déduplique les appels dans le même render tree (layout + page = 1 seul appel).
// getSession() lit le cookie sans appel réseau vers Supabase — le middleware (qui
// appelle getUser()) a déjà validé et rafraîchi la session avant que les RSC tournent.
export const requireOperatorUser = cache(async (): Promise<OperatorUser> => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.email) redirect("/connexion");

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { operator: true },
  });

  if (!dbUser) redirect("/onboarding");

  return dbUser;
});

// Route Handlers — renvoie null au lieu de rediriger.
// Pas de cache() ici : les route handlers n'ont pas de render tree React.
export async function getOperatorUser(): Promise<OperatorUser | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email },
    include: { operator: true },
  });
}
