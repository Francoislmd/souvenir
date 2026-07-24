import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { ACTIVITIES } from "@/lib/onboarding/activities";

const knownActivityIds = new Set(ACTIVITIES.map((a) => a.id));

const schema = z.object({
  name: z.string().min(2).optional(),
  logoUrl: z.string().optional(),
  brandColor: z.string().optional(),
  pricePhotoCents: z.number().int().min(0).optional(),
  pricePackCents: z.number().int().min(0).optional(),
  priceAllCents: z.number().int().min(0).optional(),
  packSize: z.number().int().min(1).optional(),
  freeCount: z.number().int().min(0).optional(),
  googleReviewUrl: z.string().optional(),
  whatsappNumber: z.string().optional(),
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

  const { logoUrl, googleReviewUrl, whatsappNumber, automations, ...rest } = parsed.data;

  const operator = await prisma.operator.update({
    where: { id: dbUser.operatorId },
    data: {
      ...rest,
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      ...(googleReviewUrl !== undefined && { googleReviewUrl: googleReviewUrl || null }),
      ...(whatsappNumber !== undefined && { whatsappNumber: whatsappNumber || null }),
      ...(automations !== undefined && { automations: { ...automations, referral: false } }),
    },
  });

  return Response.json({ operator }, { status: 200 });
}
