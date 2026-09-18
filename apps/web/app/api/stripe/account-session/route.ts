import { stripe } from "@/lib/stripe";
import { getOperatorUser } from "@/lib/current-user";
import { ensureStripeAccount } from "@/lib/stripe-connect";

/**
 * La session qui ouvre le formulaire d'inscription Stripe DANS la page
 * (composant « account-onboarding » de Connect.js), à la place de la
 * redirection vers stripe.com qui ramenait le pro sur Réglages.
 *
 * Connect.js rappelle cette route chaque fois que la session expire : elle
 * doit toujours en créer une neuve.
 */
export async function POST(): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const account = await ensureStripeAccount(dbUser);
    const session = await stripe.accountSessions.create({
      account,
      components: {
        account_onboarding: {
          enabled: true,
          features: { external_account_collection: true },
        },
      },
    });
    return Response.json({ clientSecret: session.client_secret }, { status: 200 });
  } catch (err) {
    console.error("[stripe] account session", err);
    return Response.json({ error: "Stripe ne répond pas, réessayez dans une minute." }, { status: 502 });
  }
}
