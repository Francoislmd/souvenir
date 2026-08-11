"use client";

/**
 * Événements de la landing pré-lancement (cf. HANDOFF §13). Volontairement
 * indépendant du track() interne (packages/db/src/analytics.ts) : celui-ci
 * exige un operatorId, qui n'existe pas encore pour un visiteur anonyme.
 *
 * Depuis l'installation de Google Tag Manager, ces appels alimentent le
 * dataLayer (cf. lib/gtm.ts). Les points d'appel existants n'ont pas bougé :
 * seule la destination a changé. window.plausible reste appelé s'il existe,
 * pour ne rien casser si Plausible est ajouté un jour en parallèle.
 */
import { gtmEvent, type DataLayerObject, type GtmEventName } from "@/lib/gtm";

export type MarketingEventName = "hero_email_submit" | "waitlist_submit" | "sim_interact" | "sim_values";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

/** Nos noms historiques → noms poussés dans le dataLayer. */
const GTM_NAME: Record<MarketingEventName, GtmEventName> = {
  hero_email_submit: "hero_email_submit",
  waitlist_submit: "waitlist_submit",
  sim_interact: "simulator_interact",
  sim_values: "simulator_values",
};

/**
 * Les deux soumissions d'email sont les conversions de la phase pré-lancement :
 * on double l'événement métier d'un `generate_lead` GA4, qui est le nom
 * standard attendu par Google Ads pour l'import de conversions.
 */
const LEAD_METHOD: Partial<Record<MarketingEventName, string>> = {
  hero_email_submit: "hero",
  waitlist_submit: "waitlist",
};

export function trackEvent(name: MarketingEventName, props?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;

  window.plausible?.(name, props ? { props } : undefined);
  gtmEvent(GTM_NAME[name], (props ?? {}) as DataLayerObject);

  const method = LEAD_METHOD[name];
  if (method) gtmEvent("generate_lead", { lead_method: method, currency: "EUR", value: 0 });
}
