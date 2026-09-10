"use client";

import Script from "next/script";
import { useIsClientPage } from "@/components/analytics/useClientPage";

/**
 * Charge gtm.js, sauf sur les pages clients (boutiques et galeries), où
 * aucune mesure n'est faite et donc aucun consentement demandé.
 *
 * Composant client plutôt que test dans le layout racine : le layout sert
 * aussi la landing et les pages marketing, et y lire l'en-tête Host ou le
 * chemin ferait basculer tout le site en rendu dynamique.
 */
export function GtmLoader({ script }: { script: string }) {
  if (useIsClientPage()) return null;

  return <Script id="gtm-loader" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: script }} />;
}

export function GtmNoScript({ gtmId }: { gtmId: string }) {
  if (useIsClientPage()) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
