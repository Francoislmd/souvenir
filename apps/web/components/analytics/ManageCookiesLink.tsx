"use client";

import { openCookieBanner } from "@/components/analytics/CookieBanner";
import { isGtmEnabled } from "@/lib/gtm";

/**
 * Retirer son consentement doit être aussi accessible que le donner (RGPD
 * art. 7-3). Ce lien rouvre le bandeau, panneau détaillé déjà déplié.
 * Masqué quand aucune balise n'est chargée — un lien qui n'ouvre rien serait
 * plus déroutant qu'utile.
 */
export function ManageCookiesLink({ className }: { className?: string }) {
  if (!isGtmEnabled) return null;

  return (
    <button type="button" onClick={openCookieBanner} className={className}>
      Gérer mes cookies
    </button>
  );
}
