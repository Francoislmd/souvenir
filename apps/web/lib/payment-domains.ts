import { stripe } from "./stripe";

/*
 * Apple Pay (et Google Pay) n'apparaissent dans Stripe Elements que sur un
 * domaine enregistré. En charge directe, l'enregistrement se fait sur le
 * compte Stripe de chaque opérateur (en-tête Stripe-Account), pas sur la
 * plateforme : sans lui, le bouton Apple Pay ne s'affiche jamais, sans
 * erreur visible. Stripe valide lui-même le marchand auprès d'Apple, aucun
 * fichier .well-known n'est à servir.
 *
 * Les domaines viennent des adresses publiques de l'app : linktrip.co (galeries
 * /g), sa variante www, et store.linktrip.co (boutiques de groupe).
 * localhost et *.vercel.app sont ignorés : Stripe les refuse.
 */

function hostOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".vercel.app") || /^[\d.]+$/.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

export function paymentDomains(): string[] {
  const hosts = new Set<string>();
  for (const url of [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_STORE_URL]) {
    const host = hostOf(url);
    if (!host) continue;
    hosts.add(host);
    // L'apex et www se servent tous les deux : les deux doivent être enregistrés.
    if (host.startsWith("www.")) hosts.add(host.slice(4));
    else if (host.split(".").length === 2) hosts.add(`www.${host}`);
  }
  return Array.from(hosts);
}

// Un compte déjà vérifié dans cette instance ne refait pas l'aller-retour.
const done = new Set<string>();

/** Enregistre les domaines manquants sur le compte de l'opérateur. Ne jette
 *  jamais : sans Apple Pay, la carte reste proposée. */
export async function ensurePaymentDomains(stripeAccountId: string): Promise<void> {
  if (done.has(stripeAccountId)) return;
  const wanted = paymentDomains();
  if (wanted.length === 0) return;
  const onAccount = { stripeAccount: stripeAccountId };
  try {
    const existing = await stripe.paymentMethodDomains.list({ limit: 100 }, onAccount);
    const byName = new Map(existing.data.map((d) => [d.domain_name, d]));
    for (const domain of wanted) {
      const found = byName.get(domain);
      if (!found) {
        await stripe.paymentMethodDomains.create({ domain_name: domain, enabled: true }, onAccount);
      } else if (!found.enabled) {
        await stripe.paymentMethodDomains.update(found.id, { enabled: true }, onAccount);
      }
    }
    done.add(stripeAccountId);
  } catch (err) {
    console.error("[stripe] payment method domains", stripeAccountId, err);
  }
}
