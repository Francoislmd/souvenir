import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { ACTIVITIES } from "@/lib/onboarding/activities";
import { uniqueOperatorSlug } from "@/lib/operator-slug";
import { CGV_DATE_LABEL } from "@/lib/seller-format";

const knownActivityIds = new Set(ACTIVITIES.map((a) => a.id));

const schema = z.object({
  name: z.string().min(2).optional(),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  // Chaîne vide = revenir à la phrase composée des activités.
  tagline: z.string().max(90).optional(),
  brandColor: z.string().optional(),
  pricePhotoCents: z.number().int().min(0).optional(),
  priceAllCents: z.number().int().min(0).optional(),
  packOnly: z.boolean().optional(),
  googleReviewUrl: z.string().optional(),
  whatsappNumber: z.string().optional(),
  // L'identité du vendeur, reprise sur la feuille de paiement et les reçus.
  // Chaîne vide = effacer. Le SIRET s'écrit comme on le lit (avec espaces) et
  // se range sans : 14 chiffres, ou rien.
  legalName: z.string().max(120).optional(),
  legalAddress: z.string().max(200).optional(),
  siret: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => v === "" || /^\d{14}$/.test(v), { message: "SIRET : 14 chiffres" })
    .optional(),
  vatExempt: z.boolean().optional(),
  // L'engagement sur le droit à l'image, coché à la première sortie. Il ne se
  // retire pas : seule la valeur true est acceptée, et la première date reste.
  imageRightsAck: z.literal(true).optional(),
  // Fin d'inscription : les CGU et CGV acceptées, datées, avec la version des CGV.
  termsAccept: z.literal(true).optional(),
  // Pendant l'inscription : recalculer l'adresse de la page depuis le nom.
  // Refusé dès qu'une sortie existe (un QR imprimé, un lien envoyé en dépendent).
  slugFromName: z.literal(true).optional(),
  activities: z.array(z.string()).refine((ids) => ids.every((id) => knownActivityIds.has(id)), {
    message: "Activité inconnue",
  }).optional(),
  automations: z
    .object({
      resendUnopened: z.boolean(),
      reducedPriceOffer: z.boolean(),
      reviewRequest: z.boolean(),
    })
    .optional(),
});

export async function PATCH(request: Request): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
  }

  const { logoUrl, coverUrl, tagline, googleReviewUrl, whatsappNumber, automations, legalName, legalAddress, siret, imageRightsAck, termsAccept, slugFromName, ...rest } = parsed.data;

  let slug: string | undefined;
  if (slugFromName && rest.name) {
    const hasSortie = await prisma.sortie.findFirst({ where: { operatorId: dbUser.operatorId }, select: { id: true } });
    if (hasSortie) return Response.json({ error: "slug_locked" }, { status: 409 });
    slug = await uniqueOperatorSlug(rest.name, dbUser.operatorId);
  }

  if (termsAccept) {
    await prisma.operator.update({
      where: { id: dbUser.operatorId },
      data: { termsAcceptedAt: new Date(), termsVersion: CGV_DATE_LABEL },
    });
  }

  if (imageRightsAck) {
    await prisma.operator.updateMany({
      where: { id: dbUser.operatorId, imageRightsAckAt: null },
      data: { imageRightsAckAt: new Date() },
    });
  }

  const operator = await prisma.operator.update({
    where: { id: dbUser.operatorId },
    data: {
      ...rest,
      ...(slug && { slug }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      ...(coverUrl !== undefined && { coverUrl: coverUrl || null }),
      ...(tagline !== undefined && { tagline: tagline.trim() || null }),
      ...(googleReviewUrl !== undefined && { googleReviewUrl: googleReviewUrl || null }),
      ...(whatsappNumber !== undefined && { whatsappNumber: whatsappNumber || null }),
      ...(automations !== undefined && { automations: { ...automations, referral: false } }),
      ...(legalName !== undefined && { legalName: legalName.trim() || null }),
      ...(legalAddress !== undefined && { legalAddress: legalAddress.trim() || null }),
      ...(siret !== undefined && { siret: siret || null }),
    },
  });

  return Response.json({ operator }, { status: 200 });
}
