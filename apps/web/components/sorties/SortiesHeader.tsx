"use client";

import { useEffect, useState } from "react";
import styles from "@/app/(operator)/operator.module.css";
import { NewSortieSheet, type SortieMode } from "@/components/sorties/NewSortieSheet";

function PlusIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5.8v12.4M5.8 12h12.4" />
    </svg>
  );
}

/** L'ombre n'apparaît qu'une fois la page défilée : elle dit que l'en-tête
 *  flotte au-dessus de la liste, elle ne décore pas le haut de page.
 *
 *  Le même composant porte les deux déclencheurs — le bouton d'en-tête sur
 *  grand écran, le bouton pleine largeur sur téléphone (l'en-tête masque le
 *  sien sous 760 px) — pour qu'ils partagent l'état du panneau. */
export function SortiesHeader({ activities, mode }: { activities: string[]; mode: SortieMode | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`${styles.sHdr} ${scrolled ? styles.sHdrScrolled : ""}`}>
        <div className={styles.sHdrIn}>
          <h1 className={styles.sTitle}>Sorties</h1>
          <span className={styles.sSpacer} />
          <button type="button" className={`${styles.sBtn} ${styles.sBtnPri}`} onClick={() => setOpen(true)}>
            <PlusIcon />
            Nouvelle sortie
          </button>
        </div>
      </header>

      <div className={styles.sCtaWrap}>
        <button type="button" className={`${styles.sBtn} ${styles.sBtnPri} ${styles.sCtaMobile}`} onClick={() => setOpen(true)}>
          <PlusIcon />
          Nouvelle sortie
        </button>
      </div>

      {open ? <NewSortieSheet activities={activities} mode={mode} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
