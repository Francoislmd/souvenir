import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { Role } from "@souvenir/db";
import { ACTIVITIES } from "@/lib/onboarding/activities";

const schema = z.object({
  name: z.string().min(2),
  pricePhotoCents: z.number().int().min(0),
  pricePackCents: z.number().int().min(0),
  priceAllCents: z.number().int().min(0),
  packSize: z.number().int().min(1).default(3),
  freeCount: z.number().int().min(0).default(2),
  brandColor: z.string().optional(),
  googleReviewUrl: z.string().optional(),
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

  const { name, pricePhotoCents, pricePackCents, priceAllCents, packSize, freeCount, brandColor, googleReviewUrl, qualification } =
    parsed.data;

  const base = slugify(name) || "activite";
  let slug = base;
  let suffix = 1;
  while (await prisma.operator.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  const knownIds = new Set(ACTIVITIES.map((a) => a.id));
  const rawActivities = qualification?.activities;
  const activities = Array.isArray(rawActivities)
    ? rawActivities.filter((id): id is string => typeof id === "string" && knownIds.has(id))
    : [];

  const operator = await prisma.operator.create({
    data: {
      name,
      slug,
      pricePhotoCents,
      pricePackCents,
      priceAllCents,
      packSize,
      freeCount,
      activities,
      ...(brandColor && { brandColor }),
      ...(googleReviewUrl && { googleReviewUrl }),
      users: { create: { email: user.email, role: Role.ADMIN } },
    },
  });

  if (qualification) {
    await track("onboarding_qualified", { operatorId: operator.id, meta: qualification });
  }

  return Response.json({ operatorId: operator.id, slug: operator.slug }, { status: 201 });
}
