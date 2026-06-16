import { loadStripe } from "@stripe/stripe-js";

// `null` si NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY n'est pas configurée — le
// paiement embarqué reste désactivé tant que la clé n'est pas renseignée.
export const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;
