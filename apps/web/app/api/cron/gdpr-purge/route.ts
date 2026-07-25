import { env } from "@/lib/env";
import { runGdprPurgeScan, runGroupPurgeScan } from "@/lib/gdpr";

export async function POST(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [individual, group] = await Promise.all([runGdprPurgeScan(), runGroupPurgeScan()]);
  return Response.json({ purged: individual.purged + group.purged, individual, group }, { status: 200 });
}
