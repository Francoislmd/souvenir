import { createClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { lookupSiret, normalizeSiret } from "@/lib/siret";

// La fiche d'une entreprise, par son SIRET, pour l'écran « Votre structure ».
// Réservé à un compte connecté, et limité : ce n'est pas un relais public
// vers l'annuaire.
export async function GET(request: Request): Promise<Response> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed } = await checkRateLimit(`siret:user:${user.id}`, { max: 30, windowMs: 15 * 60 * 1000 });
  if (!allowed) return Response.json({ error: "rate_limited" }, { status: 429 });

  const siret = normalizeSiret(new URL(request.url).searchParams.get("siret") ?? "");
  if (!/^\d{14}$/.test(siret)) return Response.json({ error: "invalid" }, { status: 400 });

  const match = await lookupSiret(siret);
  return Response.json({ match });
}
