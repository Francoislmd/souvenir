import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { Role } from "@souvenir/db";
import { ACTIVITIES } from "@/lib/onboarding/activities";
import { uniqueOperatorSlug } from "@/lib/operator-slug";
import { CGV_DATE_LABEL } from "@/lib/seller-format";

const schema = z.object({
  name: z.string().min(2),
  // Les prix se règlent à l'étape suivante de l'inscription : sans eux, les
  // valeurs par défaut du schéma s'appliquent (8 € / 39 €).
  pricePhotoCents: z.number().int().min(0).optional(),
  priceAllCents: z.number().int().min(0).optional(),
  brandColor: z.string().optional(),
  googleReviewUrl: z.string().optional(),
  qualification: z.record(z.unknown()).optional(),
  // L'identité du vendeur, retrouvée par le SIRET à l'écran « Votre structure ».
  // Facultative : le pro peut s'inscrire avant d'être immatriculé.
  siret: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => v === "" || /^\d{14}$/.test(v))
    .optional(),
  legalName: z.string().max(120).optional(),
  legalAddress: z.string().max(200).optional(),
});

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

  const { name, pricePhotoCents, priceAllCents, brandColor, googleReviewUrl, qualification, siret, legalName, legalAddress } = parsed.data;

  const slug = await uniqueOperatorSlug(name);

  const knownIds = new Set(ACTIVITIES.map((a) => a.id));
  const rawActivities = qualification?.activities;
  const activities = Array.isArray(rawActivities)
    ? rawActivities.filter((id): id is string => typeof id === "string" && knownIds.has(id))
    : [];

  const operator = await prisma.operator.create({
    data: {
      name,
      slug,
      ...(pricePhotoCents !== undefined && { pricePhotoCents }),
      ...(priceAllCents !== undefined && { priceAllCents }),
      // Le lot seul par défaut : la vente à l'unité est un choix que le pro
      // fait lui-même, à l'écran des prix.
      packOnly: true,
      activities,
      ...(brandColor && { brandColor }),
      ...(googleReviewUrl && { googleReviewUrl }),
      ...(siret && { siret }),
      ...(legalName?.trim() && { legalName: legalName.trim() }),
      ...(legalAddress?.trim() && { legalAddress: legalAddress.trim() }),
      // Le premier écran dit « Compte réservé aux professionnels. En le
      // créant, vous acceptez les CGU, les CGV et la politique de
      // confidentialité » : la structure se crée juste après, dans la même
      // session. On date l'acceptation et on retient la version des CGV.
      termsAcceptedAt: new Date(),
      termsVersion: CGV_DATE_LABEL,
      users: { create: { email: user.email, role: Role.ADMIN } },
    },
  });

  if (qualification) {
    // « Autre » précisé par le pro : pas de colonne pour une activité libre,
    // elle se lit dans cet événement. Texte libre, donc borné.
    const other = typeof qualification.otherActivity === "string" ? qualification.otherActivity.trim().slice(0, 60) : "";
    const meta: Record<string, unknown> = { ...qualification, activities };
    if (other && activities.includes("autre")) meta.otherActivity = other;
    else delete meta.otherActivity;
    await track("onboarding_qualified", { operatorId: operator.id, meta });
  }

  return Response.json({ operatorId: operator.id, slug: operator.slug }, { status: 201 });
}
