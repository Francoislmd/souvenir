import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
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
      business_type: "company",
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

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${env.NEXT_PUBLIC_APP_URL}/settings`,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/settings`,
    type: "account_onboarding",
  });

  return Response.json({ url: accountLink.url }, { status: 200 });
}
