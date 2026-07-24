import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { fulfillPaymentIntent } from "@/lib/order-fulfillment";

const schema = z.object({ participantId: z.string().min(1) });

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { participantId: parsed.data.participantId } });
    if (!order?.stripePi) {
      return Response.json({ ok: false }, { status: 200 });
    }

    const intent = await stripe.paymentIntents.retrieve(order.stripePi);
    if (intent.status === "succeeded") {
      await fulfillPaymentIntent(intent);
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/checkout/confirm]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
