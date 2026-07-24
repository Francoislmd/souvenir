import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { fulfillPaymentIntent } from "@/lib/order-fulfillment";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      await fulfillPaymentIntent(intent);
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const participantId = intent.metadata?.participantId;
      if (participantId) {
        await prisma.order.updateMany({ where: { participantId }, data: { status: "failed" } });
      }
      break;
    }
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      await prisma.operator.updateMany({
        where: { stripeAccountId: account.id },
        data: { stripeOnboarded: !!account.charges_enabled },
      });
      break;
    }
    default:
      break;
  }

  return new Response("OK", { status: 200 });
}
