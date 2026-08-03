import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { fulfillPaymentIntent } from "@/lib/order-fulfillment";
import { handleChargeRefunded, handleDisputeCreated, handleDisputeClosed } from "@/lib/order-refunds";
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

  try {
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
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeCreated(dispute);
        break;
      }
      case "charge.dispute.closed": {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeClosed(dispute);
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
  } catch (error) {
    console.error(`[webhooks/stripe] handler failed for ${event.type} (${event.id})`, error);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
