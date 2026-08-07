"use client";

/**
 * Événements de la landing pré-lancement (cf. HANDOFF §13). Volontairement
 * indépendant du track() interne (packages/db/src/analytics.ts) : celui-ci
 * exige un operatorId, qui n'existe pas encore pour un visiteur anonyme.
 *
 * Aucun outil de mesure (Plausible/PostHog) n'est installé pour l'instant —
 * ceci appelle window.plausible s'il existe un jour, et ne fait rien sinon.
 * Poser le <script defer data-domain="..." src="https://plausible.io/js/script.js">
 * dans app/layout.tsx suffira à l'activer, sans toucher aux points d'appel.
 */
export type MarketingEventName =
  | "hero_email_submit"
  | "waitlist_submit"
  | "sim_interact"
  | "sim_values";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

export function trackEvent(name: MarketingEventName, props?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;
  window.plausible?.(name, props ? { props } : undefined);
}
