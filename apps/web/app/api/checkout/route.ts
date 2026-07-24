import { z } from "zod";
import { track } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { createOrUpdatePaymentIntent, CheckoutError } from "@/lib/checkout";

const schema = z.object({
  participantId: z.string().min(1),
  photoIds: z.array(z.string()).default([]),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const { clientSecret, amountCents } = await createOrUpdatePaymentIntent(parsed.data);

    const participant = await prisma.participant.findUnique({ where: { id: parsed.data.participantId }, select: { sortie: { select: { operatorId: true } } } });
    if (participant) {
      await track("checkout_started", { operatorId: participant.sortie.operatorId, participantId: parsed.data.participantId });
    }

    return Response.json({ clientSecret, amountCents }, { status: 200 });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return Response.json({ error: error.code }, { status: error.code === "not_found" ? 404 : 409 });
    }
    console.error("[API /api/checkout]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
