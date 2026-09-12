/**
 * Consentement cookies — Google Consent Mode v2.
 *
 * Deux catégories exposées à l'utilisateur :
 *  - `analytics` → analytics_storage (GA4)
 *  - `ads`       → ad_storage, ad_user_data, ad_personalization, personalization_storage
 *
 * Tout est refusé par défaut (script d'amorçage dans GoogleTagManager.tsx),
 * conformément aux lignes directrices CNIL : aucun cookie de mesure ou de
 * publicité n'est déposé avant un choix explicite.
 */

export const CONSENT_STORAGE_KEY = "lt_consent_v1";
export const CONSENT_VERSION = 1;

/** CNIL : le choix doit être redemandé au bout de 6 mois maximum. */
export const CONSENT_MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000;

export interface ConsentState {
  analytics: boolean;
  ads: boolean;
}

export interface StoredConsent extends ConsentState {
  /** Version du schéma — permet de forcer un nouveau recueil si la politique change. */
  v: number;
  /** Horodatage du choix (ms epoch). */
  t: number;
}

export const CONSENT_ALL: ConsentState = { analytics: true, ads: true };
export const CONSENT_NONE: ConsentState = { analytics: false, ads: false };

type ConsentSignal = "granted" | "denied";

function signal(granted: boolean): ConsentSignal {
  return granted ? "granted" : "denied";
}

/** Traduit nos deux catégories en signaux Consent Mode v2. */
export function toConsentModePayload(state: ConsentState): Record<string, ConsentSignal> {
  return {
    ad_storage: signal(state.ads),
    ad_user_data: signal(state.ads),
    ad_personalization: signal(state.ads),
    personalization_storage: signal(state.ads),
    analytics_storage: signal(state.analytics),
  };
}

/** Lit le choix persisté. `null` = pas de choix valide → il faut afficher le bandeau. */
export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (parsed.v !== CONSENT_VERSION || typeof parsed.t !== "number") return null;
    if (Date.now() - parsed.t > CONSENT_MAX_AGE_MS) return null;
    return { analytics: !!parsed.analytics, ads: !!parsed.ads };
  } catch {
    // localStorage indisponible (Safari en navigation privée, stockage plein…)
    return null;
  }
}

/**
 * Persiste le choix, met à jour Consent Mode et prévient GTM.
 * L'événement `consent_update` permet de déclencher des balises qui doivent
 * attendre l'accord (ex. : Meta Pixel) sans dépendre du blocage natif.
 */
export function writeConsent(state: ConsentState): void {
  if (typeof window === "undefined") return;

  const payload: StoredConsent = { ...state, v: CONSENT_VERSION, t: Date.now() };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // On applique le choix pour la session même si on ne peut pas le stocker.
  }

  window.dataLayer = window.dataLayer || [];
  // Impératif : passer par gtag(), qui pousse un objet `arguments`. GTM
  // n'interprète PAS un tableau littéral comme une commande de consentement.
  // Le script d'amorçage (GoogleTagManager.tsx) définit window.gtag ; le
  // repli couvre le cas où il n'aurait pas encore été exécuté.
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }
  window.gtag("consent", "update", toConsentModePayload(state));
  window.dataLayer.push({
    event: "consent_update",
    consent_analytics: state.analytics,
    consent_ads: state.ads,
  });
}

