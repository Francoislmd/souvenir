import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * Une session dont le compte n'existe plus côté Supabase Auth (compte supprimé,
 * base remise à zéro) : le jeton du navigateur reste valide jusqu'à son
 * expiration, `getClaims()` l'accepte, mais toute route qui appelle
 * `getUser()` répond 401. L'inscription restait alors bloquée à « Votre
 * structure » (annuaire muet, structure impossible à enregistrer).
 *
 * On ne déconnecte que si Supabase confirme que la session ne vaut plus rien
 * (erreur 4xx) : un lien vers cette adresse ne peut pas couper une session
 * valide, et une panne réseau (5xx) ne déconnecte personne.
 */
export async function GET(request: Request): Promise<Response> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  const dead = !data.user && !!error && typeof error.status === "number" && error.status >= 400 && error.status < 500;
  if (dead) await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(new URL("/signup", request.url), 303);
}
