import { env } from "@/lib/env";
import { runGdprPurgeScan } from "@/lib/gdpr";

export async function POST(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runGdprPurgeScan();
  return Response.json(result, { status: 200 });
}
