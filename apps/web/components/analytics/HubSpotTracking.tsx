"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, readConsent, type ConsentState } from "@/lib/consent";
import {
  HUBSPOT_SCRIPT_SRC,
  hubspotRevoke,
  hubspotTrackPageView,
  isHubspotEnabled,
  isHubspotTrackedPath,
} from "@/lib/hubspot";

/**
 * Injecte le code de suivi HubSpot une fois le consentement « mesure
 * d'audience » donné, sur les pages publiques seulement (lib/hubspot.ts).
 * Le script compte lui-même la page où il se charge ; les navigations
 * suivantes sont poussées à la main.
 */
function Tracker() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const loadedPath = useRef<string | null>(null);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    setAllowed(readConsent()?.analytics === true);
    function onConsent(e: Event): void {
      const state = (e as CustomEvent<ConsentState>).detail;
      setAllowed(state.analytics);
      if (!state.analytics) hubspotRevoke();
    }
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  useEffect(() => {
    if (!allowed || !isHubspotTrackedPath(pathname)) return;

    if (!document.getElementById("hs-script-loader")) {
      const s = document.createElement("script");
      s.id = "hs-script-loader";
      s.async = true;
      s.defer = true;
      s.src = HUBSPOT_SCRIPT_SRC;
      document.body.appendChild(s);
      loadedPath.current = pathname;
      lastPath.current = pathname;
      return;
    }

    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (loadedPath.current === pathname) return;
    hubspotTrackPageView(pathname);
  }, [allowed, pathname]);

  return null;
}

export function HubSpotTracking() {
  if (!isHubspotEnabled) return null;
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
