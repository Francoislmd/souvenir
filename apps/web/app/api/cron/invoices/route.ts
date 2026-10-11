import { env } from "@/lib/env";
import { runMonthlyInvoicing } from "@/lib/invoicing";

// Le 1er du mois : la facture récapitulative du mois écoulé pour chaque
// opérateur qui a vendu, plus les reprises (factures ou avoirs restés en
// route). Un appel Stripe par vente : on laisse le maximum.
export const maxDuration = 300;

async function handle(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runMonthlyInvoicing();
  return Response.json(result, { status: 200 });
}

// Vercel Cron appelle en GET ; POST pour un déclenchement manuel (curl).
export const GET = handle;
export const POST = handle;
