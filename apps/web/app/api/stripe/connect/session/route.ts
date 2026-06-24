import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";

export async function POST(): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser || dbUser.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { operator } = dbUser;
  let stripeAccountId = operator.stripeAccountId;

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: dbUser.email,
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await prisma.operator.update({
      where: { id: operator.id },
      data: { stripeAccountId: account.id },
    });

    stripeAccountId = account.id;
  }

  const accountSession = await stripe.accountSessions.create({
    account: stripeAccountId,
    components: {
      account_onboarding: { enabled: true },
    },
  });

  return Response.json({ clientSecret: accountSession.client_secret });
}
