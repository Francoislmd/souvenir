import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getOperatorUser } from "@/lib/current-user";
import { ensureShareCode } from "@/lib/store";

const schema = z.object({
  activity: z.string().min(1),
  place: z.string().min(1).nullable().optional(),
  startsAt: z.string().min(1),
  seats: z.number().int().min(1).default(8),
  guide: z.string().min(1).nullable().optional(),
  mode: z.enum(["INDIVIDUEL", "GROUPE"]).default("INDIVIDUEL"),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const sortie = await prisma.sortie.create({
      data: {
        operatorId: dbUser.operatorId,
        activity: parsed.data.activity,
        place: parsed.data.place,
        startsAt: new Date(parsed.data.startsAt),
        seats: parsed.data.seats,
        guide: parsed.data.guide,
        mode: parsed.data.mode,
      },
    });

    // Une sortie GROUPE a sa propre boutique, store.linktrip.co/{slug}/{code} :
    // le code naît avec elle, pour que le QR code soit affichable sans attendre
    // la publication des photos.
    if (sortie.mode === "GROUPE") {
      await ensureShareCode(sortie);
    }

    await track("sortie_created", { operatorId: dbUser.operatorId, meta: { sortieId: sortie.id } });

    return Response.json({ sortieId: sortie.id }, { status: 201 });
  } catch (error) {
    console.error("[API /api/sorties]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
