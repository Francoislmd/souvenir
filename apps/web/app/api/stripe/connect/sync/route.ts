import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";

// Synchronise stripeOnboarded depuis l'API Stripe, sans attendre le webhook.
// Appelé depuis onExit du composant ConnectAccountOnboarding.
export async function POST(): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { operator } = dbUser;
  if (!operator.stripeAccountId) {
    return Response.json({ stripeOnboarded: false });
  }

  const account = await stripe.accounts.retrieve(operator.stripeAccountId);
  // charges_enabled suffit — means Stripe will process payments.
  // payouts_enabled arrives later (after bank verification) but doesn't block payment collection.
  const stripeOnboarded = !!account.charges_enabled;

  if (stripeOnboarded !== operator.stripeOnboarded) {
    await prisma.operator.update({
      where: { id: operator.id },
      data: { stripeOnboarded },
    });
  }

  return Response.json({ stripeOnboarded });
}
