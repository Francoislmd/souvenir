import { stripe } from "./stripe";
import { prisma } from "./prisma";
import type { OperatorUser } from "./current-user";

/**
 * Le compte Stripe du prestataire, créé au premier besoin.
 *
 * Ce que Linktrip sait déjà part avec la création, pour que Stripe ne le
 * redemande pas : le nom, l'adresse de la boutique, l'e-mail. Le type
 * d'entreprise n'est plus imposé (`individual` était codé en dur, une SARL
 * devait s'inscrire comme particulier) : Stripe le demande dans son propre
 * formulaire.
 */
/** L'adresse publique de la boutique, si elle en a une que Stripe acceptera :
 *  en local et sur les previews, il n'y a que du localhost ou du *.vercel.app,
 *  que Stripe refuse ou qui ne dit rien de l'activité. */
function publicStoreHome(slug: string): string | undefined {
  const store = process.env.NEXT_PUBLIC_STORE_URL?.trim();
  if (!store || !store.startsWith("https://")) return undefined;
  return `${store.replace(/\/+$/, "")}/${slug}`;
}

export async function ensureStripeAccount(dbUser: OperatorUser): Promise<string> {
  const { operator } = dbUser;
  if (operator.stripeAccountId) return operator.stripeAccountId;

  const account = await stripe.accounts.create({
    type: "express",
    country: "FR",
    email: dbUser.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      name: operator.name,
      url: publicStoreHome(operator.slug),
      product_description: "Vente des photos prises pendant nos sorties, à nos clients.",
    },
  });

  // Deux onglets ouverts en même temps ne doivent pas créer deux comptes :
  // on n'écrit que si la colonne est encore vide, et on relit le gagnant.
  await prisma.operator.updateMany({
    where: { id: operator.id, stripeAccountId: null },
    data: { stripeAccountId: account.id },
  });
  const fresh = await prisma.operator.findUnique({ where: { id: operator.id }, select: { stripeAccountId: true } });
  return fresh?.stripeAccountId ?? account.id;
}
