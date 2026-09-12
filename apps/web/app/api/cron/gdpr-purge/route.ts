import { env } from "@/lib/env";
import { runGdprPurgeScan, runGroupPurgeScan } from "@/lib/gdpr";

// Une purge supprime les fichiers de stockage participant par participant :
// la durée dépend du volume échu, pas de la charge CPU.
export const maxDuration = 300;

async function handle(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [individual, group] = await Promise.all([runGdprPurgeScan(), runGroupPurgeScan()]);
  return Response.json({ purged: individual.purged + group.purged, individual, group }, { status: 200 });
}

// Vercel Cron appelle en GET (voir /api/cron/automations) : n'exporter que
// POST revenait à ne jamais purger, alors que la conservation 90 jours est
// annoncée aux clients dans les emails et les CGU.
export const GET = handle;
export const POST = handle;
