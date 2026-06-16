import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { fulfillCheckoutSession } from "@/lib/checkout-fulfillment";
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
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await fulfillCheckoutSession(session);
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const deliveryId = intent.metadata?.deliveryId;
      if (deliveryId) {
        await prisma.order.updateMany({
          where: { deliveryId },
          data: { status: "failed" },
        });
      }
      break;
    }
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      await prisma.operator.updateMany({
        where: { stripeAccountId: account.id },
        data: { stripeOnboarded: account.charges_enabled && account.payouts_enabled },
      });
      break;
    }
    default:
      break;
  }

  return new Response("OK", { status: 200 });
}
