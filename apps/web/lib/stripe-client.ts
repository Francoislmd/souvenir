import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Charge directe : le PaymentIntent vit sur le compte Stripe de l'opérateur,
// Stripe.js doit donc être chargé « au nom » de ce compte, sinon la
// confirmation échoue (PaymentIntent introuvable). Une instance par compte,
// gardée en cache pour ne pas recharger le script à chaque ouverture.
//
// `null` si NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY n'est pas configurée — le
// paiement embarqué reste désactivé tant que la clé n'est pas renseignée.
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const cache = new Map<string, Promise<Stripe | null>>();

export function getStripe(stripeAccountId: string): Promise<Stripe | null> | null {
  if (!publishableKey) return null;
  let promise = cache.get(stripeAccountId);
  if (!promise) {
    promise = loadStripe(publishableKey, { stripeAccount: stripeAccountId });
    cache.set(stripeAccountId, promise);
  }
  return promise;
}
