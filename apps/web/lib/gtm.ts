/**
 * Couche d'accès au dataLayer Google Tag Manager.
 *
 * Règle du projet : AUCUN composant n'appelle `window.dataLayer.push` en direct.
 * Tout passe par les helpers ci-dessous, pour que les noms d'événements et la
 * forme des paramètres restent cohérents entre le code et la config GTM.
 *
 * Pas d'événements e-commerce ici : la seule page qui en poussait était la
 * galerie client, et GTM n'y est délibérément pas chargé (voir GtmLoader et
 * useIsClientPage) — l'entonnoir d'achat est mesuré côté serveur dans la
 * table Event. Ces poussées partaient donc dans un dataLayer que personne ne
 * lisait.
 */

export type DataLayerValue = string | number | boolean | null | undefined | DataLayerObject | DataLayerValue[];
export interface DataLayerObject {
  [key: string]: DataLayerValue;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Événements « métier » (hors e-commerce). Un seul endroit pour les nommer. */
export type GtmEventName =
  // Navigation
  | "page_view"
  // Acquisition / landing
  | "cta_click"
  | "generate_lead"
  | "hero_email_submit"
  | "footer_email_submit"
  | "waitlist_submit"
  | "simulator_interact"
  | "simulator_values"
  // Inscription opérateur
  | "sign_up_start"
  | "sign_up"
  | "onboarding_step"
  | "onboarding_complete"
  | "stripe_onboarding_start"
  | "stripe_onboarding_done"
  // Usage opérateur
  | "sortie_created"
  | "photos_uploaded"
  | "gallery_sent"
  // Consentement
  | "consent_update";

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "";
export const isGtmEnabled = GTM_ID.length > 0;

/**
 * Pousse un objet brut. Sûr côté serveur (no-op) et avant le chargement de
 * GTM : le dataLayer est une simple file, GTM rejoue tout à son démarrage.
 */
export function pushToDataLayer(payload: DataLayerObject): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

/** Événement métier générique. */
export function gtmEvent(event: GtmEventName, params: DataLayerObject = {}): void {
  pushToDataLayer({ event, ...params });
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

export function trackPageView(path: string, title?: string): void {
  pushToDataLayer({
    event: "page_view",
    page_path: path,
    page_location: typeof window !== "undefined" ? window.location.href : undefined,
    page_title: title ?? (typeof document !== "undefined" ? document.title : undefined),
    page_referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
  });
}
