import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit, requestIp } from "@/lib/auth/rate-limit";

const bodySchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  remember: z.boolean().default(true),
});

// "Rester connecté" décoché → cookie de session (pas de maxAge/expires) :
// effacé à la fermeture du navigateur au lieu de suivre la durée de vie du
// refresh token Supabase.
function createSessionAwareClient(remember: boolean) {
  const cookieStore = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        const finalOptions = remember ? options : { ...options, maxAge: undefined, expires: undefined };
        cookieStore.set({ name, value, ...finalOptions });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

// Message générique, toujours le même quelle que soit la cause du refus —
// ne jamais laisser deviner si le compte existe.
const GENERIC_ERROR = "Email ou mot de passe incorrect.";

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }
  const { email, password, remember } = parsed.data;
  const ip = requestIp(req);

  const [byIp, byEmail] = await Promise.all([
    checkRateLimit(`login:ip:${ip}`, { max: MAX_PER_IP, windowMs: WINDOW_MS }),
    checkRateLimit(`login:email:${email.trim().toLowerCase()}`, { max: MAX_PER_EMAIL, windowMs: WINDOW_MS }),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
  }

  const supabase = createSessionAwareClient(remember);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
