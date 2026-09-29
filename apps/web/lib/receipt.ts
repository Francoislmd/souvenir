import type Stripe from "stripe";
import { stripe } from "./stripe";

const BRANDS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  cartes_bancaires: "CB",
};

/**
 * « Visa •••• 4242 », pour le reçu. Le PaymentIntent reçu par le webhook ne
 * porte que l'identifiant du paiement : il faut relire la charge, sur le
 * compte de l'opérateur (charge directe). Un échec n'empêche jamais l'envoi
 * du reçu : la ligne « Carte » est alors simplement omise.
 */
export async function cardLabelOf(intent: Stripe.PaymentIntent, stripeAccount: string | null): Promise<string | null> {
  const charge = intent.latest_charge;
  if (!charge || !stripeAccount) return null;
  try {
    const full = typeof charge === "string" ? await stripe.charges.retrieve(charge, {}, { stripeAccount }) : charge;
    const card = full.payment_method_details?.card;
    if (!card?.last4) return null;
    return `${BRANDS[card.brand ?? ""] ?? "Carte"} •••• ${card.last4}`;
  } catch (error) {
    console.error("[receipt] card lookup failed:", error);
    return null;
  }
}
