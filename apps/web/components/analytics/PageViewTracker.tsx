"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/gtm";

/**
 * En App Router, les navigations client ne rechargent pas la page : la balise
 * GA4 « page vue au chargement » ne se déclenche qu'une fois. On pousse donc
 * nous-mêmes un `page_view` à chaque changement d'URL, et on désactive la vue
 * de page automatique côté GTM (cf. docs/analytics-gtm.md).
 */
function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    const qs = searchParams.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;

    // React 18 monte deux fois les effets en dev ; le garde-fou évite aussi
    // les doublons quand seul un state interne change.
    if (lastUrl.current === url) return;
    lastUrl.current = url;

    // Laisse Next mettre à jour document.title avant de lire la valeur.
    const id = window.setTimeout(() => trackPageView(url), 0);
    return () => window.clearTimeout(id);
  }, [pathname, searchParams]);

  return null;
}

export function PageViewTracker() {
  // useSearchParams() impose une frontière Suspense, sinon toutes les pages
  // qui l'englobent basculent en rendu dynamique.
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
