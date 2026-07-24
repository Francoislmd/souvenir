import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimit, requestIp } from "@/lib/auth/rate-limit";
import { isEmail } from "@/lib/auth/password-strength";

const bodySchema = z.object({
  email: z.string().min(1),
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !isEmail(parsed.data.email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const email = parsed.data.email.trim();
  const ip = requestIp(req);

  const [byIp, byEmail] = await Promise.all([
    checkRateLimit(`reset:ip:${ip}`, { max: MAX_PER_IP, windowMs: WINDOW_MS }),
    checkRateLimit(`reset:email:${email.toLowerCase()}`, { max: MAX_PER_EMAIL, windowMs: WINDOW_MS }),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;
  const supabase = createClient();
  // On ignore volontairement le résultat : que l'adresse existe ou non, la
  // réponse au client est identique (cf. brief §3, non négociable).
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reinitialiser`,
  });

  return NextResponse.json({ ok: true });
}
