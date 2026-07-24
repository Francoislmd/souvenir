import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";

const schema = z.object({
  activity: z.string().min(1).optional(),
  place: z.string().min(1).nullable().optional(),
  startsAt: z.string().min(1).optional(),
  seats: z.number().int().min(1).optional(),
  guide: z.string().min(1).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
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

    const sortie = await prisma.sortie.findFirst({
      where: { id: params.sortieId, operatorId: dbUser.operatorId },
    });
    if (!sortie) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.sortie.update({
      where: { id: sortie.id },
      data: {
        ...(parsed.data.activity !== undefined ? { activity: parsed.data.activity } : {}),
        ...(parsed.data.place !== undefined ? { place: parsed.data.place } : {}),
        ...(parsed.data.startsAt !== undefined ? { startsAt: new Date(parsed.data.startsAt) } : {}),
        ...(parsed.data.seats !== undefined ? { seats: parsed.data.seats } : {}),
        ...(parsed.data.guide !== undefined ? { guide: parsed.data.guide } : {}),
      },
    });

    return Response.json({ sortieId: updated.id }, { status: 200 });
  } catch (error) {
    console.error("[API /api/sorties/[sortieId]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
