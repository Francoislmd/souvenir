"use client";

import { useState } from "react";
import styles from "@/app/(operator)/operator.module.css";
import { AppHeader } from "@/components/operator/AppHeader";
import { NewSortieSheet, type SortieMode } from "@/components/sorties/NewSortieSheet";

function PlusIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5.8v12.4M5.8 12h12.4" />
    </svg>
  );
}

/** Les deux déclencheurs — le bouton d'en-tête sur grand écran, le bouton
 *  pleine largeur sur téléphone (l'en-tête masque le sien sous 760 px) —
 *  vivent dans le même composant pour partager l'état du panneau. */
export function SortiesHeader({ activities, mode }: { activities: string[]; mode: SortieMode | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppHeader
        title="Sorties"
        action={
          <button type="button" className={`${styles.sBtn} ${styles.sBtnPri}`} onClick={() => setOpen(true)}>
            <PlusIcon />
            Nouvelle sortie
          </button>
        }
      />

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
