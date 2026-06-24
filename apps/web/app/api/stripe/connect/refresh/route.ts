import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { getOperatorUser } from "@/lib/current-user";

// Stripe appelle cette URL quand le lien d'onboarding a expiré.
// On génère un nouveau lien et on redirige.
export async function GET(): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser || !dbUser.operator.stripeAccountId) {
    redirect("/settings");
  }

  const accountLink = await stripe.accountLinks.create({
    account: dbUser.operator.stripeAccountId,
    refresh_url: `${env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/refresh`,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
    type: "account_onboarding",
  });

  redirect(accountLink.url);
}
