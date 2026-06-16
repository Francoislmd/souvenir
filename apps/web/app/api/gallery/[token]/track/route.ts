import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";

const schema = z.object({
  name: z.enum(["preview_played", "review_link_clicked", "ig_share_clicked"]),
  meta: z.record(z.unknown()).optional(),
});

export async function POST(request: Request, { params }: { params: { token: string } }): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const delivery = await prisma.delivery.findUnique({
      where: { token: params.token },
      include: { session: true },
    });
    if (!delivery) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await track(parsed.data.name, {
      operatorId: delivery.session.operatorId,
      deliveryId: delivery.id,
      meta: parsed.data.meta,
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/gallery/[token]/track]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
