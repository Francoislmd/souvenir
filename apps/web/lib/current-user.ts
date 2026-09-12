import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase-server";
import { prisma } from "./prisma";
import type { Operator, User } from "@souvenir/db";

export type OperatorUser = User & { operator: Operator };

/**
 * L'adresse email de la session, VÉRIFIÉE.
 *
 * `getSession()` ne vérifie pas la signature du JWT — le SDK le dit
 * lui-même : « If using an insecure storage medium, such as cookies […] the
 * user object returned by this function must not be trusted ». Le code
 * précédent s'en remettait au middleware, qui appelle bien `getUser()` mais
 * en ignore le résultat : il renvoie la réponse dans tous les cas. Un cookie
 * forgé portant un JWT non expiré et une signature quelconque ouvrait donc
 * l'espace d'un autre opérateur.
 *
 * `getClaims()` vérifie pour de bon : localement via WebCrypto si le projet
 * signe en asymétrique (aucun aller-retour réseau une fois le JWKS en cache),
 * sinon par un appel serveur équivalent à `getUser()`. C'est la seule forme
 * qui soit à la fois sûre et rapide — à condition de basculer le projet
 * Supabase sur des clés de signature asymétriques (réglage tableau de bord).
 */
async function verifiedEmail(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  const email = data.claims.email;
  return typeof email === "string" && email.length > 0 ? email : null;
}

// Déduplique les appels dans le même render tree (layout + page = 1 seul appel).
export const requireOperatorUser = cache(async (): Promise<OperatorUser> => {
  const email = await verifiedEmail();
  if (!email) redirect("/connexion");

  const dbUser = await prisma.user.findUnique({
    where: { email },
    include: { operator: true },
  });

  if (!dbUser) redirect("/onboarding");

  return dbUser;
});

// Route Handlers — renvoie null au lieu de rediriger.
// Pas de cache() ici : les route handlers n'ont pas de render tree React.
export async function getOperatorUser(): Promise<OperatorUser | null> {
  const email = await verifiedEmail();
  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
    include: { operator: true },
  });
}
