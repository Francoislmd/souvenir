"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";

/** Identifiant du conteneur qui défile au-dessus de 760 px. */
export const SCROLL_ROOT_ID = "op-scroll";

/**
 * La carte blanche du contenu, posée à côté de la colonne de verre.
 *
 * Au-dessus de 760 px c'est elle qui défile, pas la fenêtre : l'en-tête
 * collant reste ainsi dans la carte, sous ses coins arrondis, au lieu de
 * coller au bord de l'écran. Sur téléphone la carte disparaît et la fenêtre
 * défile comme avant.
 *
 * Le layout survit aux navigations, donc la position de défilement aussi :
 * sans la remise à zéro, ouvrir une sortie depuis le bas de la liste
 * l'afficherait déjà défilée.
 */
export function ScrollRoot({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div ref={ref} id={SCROLL_ROOT_ID} className={styles.main}>
      {children}
    </div>
  );
}

/** Remonte en haut de l'écran, quel que soit ce qui défile. */
export function scrollToTop(behavior: ScrollBehavior = "smooth") {
  window.scrollTo({ top: 0, behavior });
  document.getElementById(SCROLL_ROOT_ID)?.scrollTo({ top: 0, behavior });
}
