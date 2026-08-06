import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, requestIp } from "@/lib/auth/rate-limit";

const schema = z.object({
  email: z.string().email(),
  company: z.string().optional(),
  activity: z.string().optional(),
  yearlyGuests: z.string().optional(),
  photoUsage: z.string().optional(),
  source: z.string().optional(),
  website: z.string().optional(), // honeypot — doit rester vide
});

// Toujours 200, que l'e-mail soit nouveau ou déjà inscrit — jamais révéler à
// un visiteur qu'il est déjà sur la liste. L'accueil ne capture que l'e-mail
// puis redirige vers /liste-attente pour compléter la qualification : cette
// seconde soumission est un doublon *par construction*, donc upsert (fusion
// des champs fournis) plutôt qu'un no-op qui perdrait la qualification.
export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
  }

  const { website, ...data } = parsed.data;
  if (website) {
    // Honeypot rempli : probablement un bot. On simule un succès sans rien écrire.
    return Response.json({ ok: true }, { status: 200 });
  }

  const { allowed } = await checkRateLimit(`waitlist:ip:${requestIp(request)}`, { max: 8, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return Response.json({ error: "Trop de tentatives, réessayez plus tard." }, { status: 429 });
  }

  const email = data.email.trim().toLowerCase();
  const userAgent = request.headers.get("user-agent") ?? undefined;

  try {
    await prisma.waitlist.upsert({
      where: { email },
      create: {
        email,
        company: data.company,
        activity: data.activity,
        yearlyGuests: data.yearlyGuests,
        photoUsage: data.photoUsage,
        source: data.source,
        userAgent,
      },
      update: {
        ...(data.company ? { company: data.company } : {}),
        ...(data.activity ? { activity: data.activity } : {}),
        ...(data.yearlyGuests ? { yearlyGuests: data.yearlyGuests } : {}),
        ...(data.photoUsage ? { photoUsage: data.photoUsage } : {}),
        ...(data.source ? { source: data.source } : {}),
        ...(userAgent ? { userAgent } : {}),
      },
    });
    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/waitlist]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
