import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { env } from "@/lib/env";

const schema = z.object({ deliveryId: z.string().min(1) });

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: parsed.data.deliveryId },
      include: { session: { include: { operator: true } } },
    });
    if (!delivery) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const operator = delivery.session.operator;
    if (!operator.stripeOnboarded || !operator.stripeAccountId) {
      return Response.json({ error: "stripe_not_ready" }, { status: 409 });
    }

    const amountCents = operator.packPriceCents;
    const feeCents = Math.round((amountCents * operator.feePercent) / 100);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `Pack HD photos & vidéo — ${operator.name}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: feeCents,
        transfer_data: { destination: operator.stripeAccountId },
      },
      metadata: { deliveryId: delivery.id },
      return_url: `${env.NEXT_PUBLIC_APP_URL}/g/${delivery.token}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
    });

    await track("checkout_started", { operatorId: operator.id, deliveryId: delivery.id });

    return Response.json({ clientSecret: checkoutSession.client_secret }, { status: 200 });
  } catch (error) {
    console.error("[API /api/checkout]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
