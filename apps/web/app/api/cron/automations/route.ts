import { env } from "@/lib/env";
import { runAutomationScan } from "@/lib/automations";

// Le scan parcourt tous les participants éligibles et envoie un email (ou un
// WhatsApp) par participant : au-delà du défaut Vercel, c'est la durée
// d'envoi cumulée qui commande, pas le calcul.
export const maxDuration = 300;

async function handle(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAutomationScan();
  return Response.json(result, { status: 200 });
}

// Vercel Cron appelle en GET, jamais en POST — n'exporter que POST revenait à
// répondre 405 à chaque déclenchement, c'est-à-dire à n'envoyer aucune relance
// ni aucune offre depuis la mise en place du cron. POST reste exporté pour le
// déclenchement manuel (curl) et pour ne casser aucun appel existant.
export const GET = handle;
export const POST = handle;
