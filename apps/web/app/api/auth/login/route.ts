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

// Une panne d'infrastructure n'est PAS un refus d'identifiants. Le 31/08/2026,
// le projet Supabase restreint pour dépassement de quota répondait 402 sur
// /auth/v1/token : l'écran de connexion affichait « Email ou mot de passe
// incorrect » et la panne a été cherchée du mauvais côté pendant des heures.
const SERVICE_ERROR = "Service momentanément indisponible. Ce n'est pas votre mot de passe — réessayez dans quelques minutes.";

// Seuls ces statuts veulent dire « Supabase a lu les identifiants et les
// refuse ». Tout le reste (402 quota, 5xx, coupure réseau) est une panne.
const CREDENTIAL_REFUSAL_STATUSES = new Set([400, 401, 403, 422]);

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
    const status = error.status ?? 0;
    if (status === 429) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
    }
    if (!CREDENTIAL_REFUSAL_STATUSES.has(status)) {
      console.error("[api/auth/login] panne côté Supabase", { status, message: error.message });
      return NextResponse.json({ error: SERVICE_ERROR }, { status: 503 });
    }
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
