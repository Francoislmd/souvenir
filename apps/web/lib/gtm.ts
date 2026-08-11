/**
 * Couche d'accès au dataLayer Google Tag Manager.
 *
 * Règle du projet : AUCUN composant n'appelle `window.dataLayer.push` en direct.
 * Tout passe par les helpers ci-dessous, pour que les noms d'événements et la
 * forme des paramètres restent cohérents entre le code et la config GTM.
 *
 * Les événements e-commerce suivent la spécification GA4 :
 * https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
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
  // Galerie client
  | "gallery_open"
  | "photo_preview"
  | "select_all_photos"
  | "review_click"
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

/* ------------------------------------------------------------------ */
/* E-commerce GA4                                                      */
/* ------------------------------------------------------------------ */

export interface GtmItem extends DataLayerObject {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_brand?: string;
  price?: number;
  quantity?: number;
  index?: number;
}

export const CURRENCY = "EUR";

/** Centimes → euros, arrondi à 2 décimales (GA4 attend un nombre décimal). */
export function toEuros(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * GA4 impose de vider `ecommerce` avant chaque événement, sinon les objets
 * d'un push précédent fuient dans le suivant.
 */
function pushEcommerce(event: string, ecommerce: DataLayerObject, extra: DataLayerObject = {}): void {
  pushToDataLayer({ ecommerce: null });
  pushToDataLayer({ event, ...extra, ecommerce: { currency: CURRENCY, ...ecommerce } });
}

export function trackViewItemList(params: {
  items: GtmItem[];
  listId: string;
  listName: string;
  extra?: DataLayerObject;
}): void {
  pushEcommerce(
    "view_item_list",
    { item_list_id: params.listId, item_list_name: params.listName, items: params.items },
    params.extra,
  );
}

export function trackViewItem(params: { items: GtmItem[]; valueCents: number; extra?: DataLayerObject }): void {
  pushEcommerce("view_item", { value: toEuros(params.valueCents), items: params.items }, params.extra);
}

export function trackAddToCart(params: { items: GtmItem[]; valueCents: number; extra?: DataLayerObject }): void {
  pushEcommerce("add_to_cart", { value: toEuros(params.valueCents), items: params.items }, params.extra);
}

export function trackRemoveFromCart(params: { items: GtmItem[]; valueCents: number; extra?: DataLayerObject }): void {
  pushEcommerce("remove_from_cart", { value: toEuros(params.valueCents), items: params.items }, params.extra);
}

export function trackBeginCheckout(params: { items: GtmItem[]; valueCents: number; extra?: DataLayerObject }): void {
  pushEcommerce("begin_checkout", { value: toEuros(params.valueCents), items: params.items }, params.extra);
}

export function trackAddPaymentInfo(params: {
  items: GtmItem[];
  valueCents: number;
  paymentType?: string;
  extra?: DataLayerObject;
}): void {
  pushEcommerce(
    "add_payment_info",
    { value: toEuros(params.valueCents), payment_type: params.paymentType ?? "card", items: params.items },
    params.extra,
  );
}

export function trackPurchase(params: {
  transactionId: string;
  items: GtmItem[];
  valueCents: number;
  extra?: DataLayerObject;
}): void {
  pushEcommerce(
    "purchase",
    {
      transaction_id: params.transactionId,
      value: toEuros(params.valueCents),
      /**
       * Pas de TVA ni de frais de port sur une vente de fichiers numériques :
       * on les envoie explicitement à 0 pour que GA4 ne les laisse pas vides.
       */
      tax: 0,
      shipping: 0,
      items: params.items,
    },
    params.extra,
  );
}
