import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { Mode, Role } from "@souvenir/db";

const schema = z.object({
  name: z.string().min(2),
  packPriceCents: z.number().int().min(0),
  defaultMode: z.nativeEnum(Mode),
  location: z.string().optional(),
  brandColor: z.string().optional(),
  instagramHandle: z.string().optional(),
  googleReviewUrl: z.string().optional(),
  trustpilotUrl: z.string().optional(),
  tripadvisorUrl: z.string().optional(),
  // Réponses de qualification de l'onboarding (activités, volumétrie, prise de
  // photo) — pas de colonne dédiée, juste tracées pour l'analytics/CRM.
  qualification: z.record(z.unknown()).optional(),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

export async function POST(request: Request): Promise<Response> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.user.findUnique({ where: { email: user.email } });
  if (existing) {
    return Response.json({ error: "Already onboarded" }, { status: 409 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const nameIssue = parsed.error.errors.find((e) => e.path[0] === "name");
    const message = nameIssue
      ? "Le nom affiché doit contenir au moins 2 caractères."
      : "Certaines informations ne sont pas valides — vérifie tes champs et réessaie.";
    return Response.json({ error: message, details: parsed.error.errors }, { status: 400 });
  }

  const {
    name,
    packPriceCents,
    defaultMode,
    location,
    brandColor,
    instagramHandle,
    googleReviewUrl,
    trustpilotUrl,
    tripadvisorUrl,
    qualification,
  } = parsed.data;

  const base = slugify(name) || "activite";
  let slug = base;
  let suffix = 1;
  while (await prisma.operator.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  const operator = await prisma.operator.create({
    data: {
      name,
      slug,
      packPriceCents,
      defaultMode,
      ...(location && { location }),
      ...(brandColor && { brandColor }),
      ...(instagramHandle && { instagramHandle: instagramHandle.replace(/^@/, "") }),
      ...(googleReviewUrl && { googleReviewUrl }),
      ...(trustpilotUrl && { trustpilotUrl }),
      ...(tripadvisorUrl && { tripadvisorUrl }),
      users: { create: { email: user.email, role: Role.ADMIN } },
    },
  });

  if (qualification) {
    await track("onboarding_qualified", { operatorId: operator.id, meta: qualification });
  }

  return Response.json({ operatorId: operator.id, slug: operator.slug }, { status: 201 });
}
