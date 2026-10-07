import { createClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { lookupSiret, normalizeSiret, searchCompanies } from "@/lib/siret";

// Retrouver une entreprise pour l'écran « Votre structure » : par son SIRET
// (?siret=, une fiche) ou par son nom (?q=, quelques fiches, saisie au fil de
// la frappe). Réservé à un compte connecté, et limité : ce n'est pas un relais
// public vers l'annuaire.
export async function GET(request: Request): Promise<Response> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // La recherche par nom part au fil de la frappe (après une pause) : la limite
  // laisse de la marge pour quelques essais de nom.
  const { allowed } = await checkRateLimit(`siret:user:${user.id}`, { max: 120, windowMs: 15 * 60 * 1000 });
  if (!allowed) return Response.json({ error: "rate_limited" }, { status: 429 });

  const params = new URL(request.url).searchParams;
  const q = params.get("q");
  if (q !== null) {
    const query = q.trim().slice(0, 80);
    if (query.length < 3) return Response.json({ error: "invalid" }, { status: 400 });
    return Response.json({ matches: await searchCompanies(query) });
  }

  const siret = normalizeSiret(params.get("siret") ?? "");
  if (!/^\d{14}$/.test(siret)) return Response.json({ error: "invalid" }, { status: 400 });

  const match = await lookupSiret(siret);
  return Response.json({ match });
}
