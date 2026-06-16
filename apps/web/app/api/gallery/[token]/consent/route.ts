import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ consentImage: z.boolean() });

export async function PATCH(request: Request, { params }: { params: { token: string } }): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const delivery = await prisma.delivery.findUnique({ where: { token: params.token } });
    if (!delivery) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.delivery.update({
      where: { id: delivery.id },
      data: { consentImage: parsed.data.consentImage },
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/gallery/[token]/consent]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
