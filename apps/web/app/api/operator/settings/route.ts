import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Mode } from "@souvenir/db";
import { getOperatorUser } from "@/lib/current-user";

const schema = z.object({
  name: z.string().min(2).optional(),
  logoUrl: z.string().optional(),
  location: z.string().optional(),
  brandColor: z.string().optional(),
  packPriceCents: z.number().int().min(0).optional(),
  defaultMode: z.nativeEnum(Mode).optional(),
  googleReviewUrl: z.string().optional(),
  trustpilotUrl: z.string().optional(),
  tripadvisorUrl: z.string().optional(),
  instagramHandle: z.string().optional(),
  instagramPostCaption: z.string().optional(),
  whatsappNumber: z.string().optional(),
  deliveryMessageTemplate: z.string().optional(),
});

export async function PATCH(request: Request): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser || dbUser.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
  }

  const {
    logoUrl,
    location,
    googleReviewUrl,
    trustpilotUrl,
    tripadvisorUrl,
    instagramHandle,
    instagramPostCaption,
    whatsappNumber,
    deliveryMessageTemplate,
    ...rest
  } = parsed.data;

  const operator = await prisma.operator.update({
    where: { id: dbUser.operatorId },
    data: {
      ...rest,
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      ...(location !== undefined && { location: location || null }),
      ...(googleReviewUrl !== undefined && { googleReviewUrl: googleReviewUrl || null }),
      ...(trustpilotUrl !== undefined && { trustpilotUrl: trustpilotUrl || null }),
      ...(tripadvisorUrl !== undefined && { tripadvisorUrl: tripadvisorUrl || null }),
      ...(instagramHandle !== undefined && { instagramHandle: instagramHandle || null }),
      ...(instagramPostCaption !== undefined && { instagramPostCaption: instagramPostCaption || null }),
      ...(whatsappNumber !== undefined && { whatsappNumber: whatsappNumber || null }),
      ...(deliveryMessageTemplate !== undefined && { deliveryMessageTemplate: deliveryMessageTemplate || null }),
    },
  });

  return Response.json({ operator }, { status: 200 });
}
