"use client";

import { usePathname } from "next/navigation";

/**
 * Vrai sur les pages destinées aux clients finaux : les boutiques
 * (`/s/...`, et tout le sous-domaine `store.`) et les galeries individuelles
 * (`/g/...`). Aucune mesure d'audience n'y est chargée, donc aucun
 * consentement n'y est demandé.
 *
 * Deux tests et non un, à cause de la réécriture d'hôte : sur
 * store.linktrip.co, le serveur voit `/s/{slug}` tandis que le navigateur
 * affiche `/{slug}`. Le chemin couvre donc le rendu serveur, l'hôte couvre
 * l'hydratation, et les deux répondent la même chose au même moment.
 */
export function useIsClientPage(): boolean {
  const pathname = usePathname();

  if (typeof window !== "undefined" && window.location.hostname.split(":")[0]!.startsWith("store.")) {
    return true;
  }
  return pathname === "/s" || pathname.startsWith("/s/") || pathname.startsWith("/g/");
}
