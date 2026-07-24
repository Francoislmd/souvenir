import { env } from "@/lib/env";
import { runAutomationScan } from "@/lib/automations";

export async function POST(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAutomationScan();
  return Response.json(result, { status: 200 });
}
