/**
 * Code de suivi HubSpot (portail Linktrip, région EU1).
 *
 * But : savoir si un prospect qui a reçu un e-mail de prospection est venu
 * sur le site, et quelles pages il a lues. HubSpot rattache la visite au
 * contact quand il a cliqué un lien suivi d'un e-mail HubSpot, ou quand il
 * laisse son adresse dans un formulaire du site (`hubspotIdentify`).
 *
 * Deux garde-fous :
 *  - consentement : le script n'est injecté qu'après un « oui » à la mesure
 *    d'audience dans le bandeau (lib/consent.ts). Aucun cookie avant.
 *  - pages : liste blanche des pages publiques. Jamais sur les galeries
 *    (`/g/{token}` : le token est le seul secret d'accès), les boutiques,
 *    l'espace pro, l'auth (`/reinitialiser`, `/auth/callback` portent des
 *    jetons dans l'URL) ni `/code`.
 *
 * Sans NEXT_PUBLIC_HUBSPOT_PORTAL_ID (local, previews), rien ne se charge.
 */

export const HUBSPOT_PORTAL_ID = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID ?? "";
export const isHubspotEnabled = HUBSPOT_PORTAL_ID.length > 0;
export const HUBSPOT_SCRIPT_SRC = `https://js-eu1.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`;

const TRACKED_PREFIXES = [
  "/activites",
  "/produit",
  "/liste-attente",
  "/signup",
  "/cgu",
  "/cgv",
  "/confidentialite",
  "/mentions-legales",
];

/** Vrai si la page peut charger le code HubSpot. */
export function isHubspotTrackedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return TRACKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    _hsq?: any[];
    _hsp?: any[];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function hsq(): unknown[] {
  window._hsq = window._hsq || [];
  return window._hsq;
}

/** Vue de page après une navigation client (App Router ne recharge pas la page). */
export function hubspotTrackPageView(path: string): void {
  if (typeof window === "undefined" || !isHubspotEnabled) return;
  hsq().push(["setPath", path]);
  hsq().push(["trackPageView"]);
}

/**
 * Rattache le visiteur à son adresse e-mail (formulaires de liste d'attente).
 * Envoyé avec la vue de page suivante ; sans effet tant que le script n'est
 * pas chargé, donc sans effet sans consentement.
 */
export function hubspotIdentify(email: string): void {
  if (typeof window === "undefined" || !isHubspotEnabled || !document.getElementById("hs-script-loader")) return;
  hsq().push(["identify", { email }]);
  hsq().push(["trackPageView"]);
}

/** Retrait du consentement : HubSpot efface ses cookies. */
export function hubspotRevoke(): void {
  if (typeof window === "undefined" || !isHubspotEnabled) return;
  window._hsp = window._hsp || [];
  window._hsp.push(["revokeCookieConsent"]);
}
