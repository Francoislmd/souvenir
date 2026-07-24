import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { getOperatorUser } from "@/lib/current-user";

export async function POST(request: Request): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { operator } = dbUser;

  // returnPath permet à l'appelant de choisir la destination post-onboarding
  const body = await request.json().catch(() => ({})) as { returnPath?: string };
  const returnPath = body.returnPath ?? "/reglages";

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

  const base = env.NEXT_PUBLIC_APP_URL;
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${base}/api/stripe/connect/refresh`,
    return_url: `${base}${returnPath}`,
    type: "account_onboarding",
  });

  return Response.json({ url: accountLink.url }, { status: 200 });
}
