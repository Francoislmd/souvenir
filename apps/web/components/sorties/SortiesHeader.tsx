"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "@/app/(operator)/operator.module.css";

/** L'ombre n'apparaît qu'une fois la page défilée : elle dit que l'en-tête
 *  flotte au-dessus de la liste, elle ne décore pas le haut de page. */
export function SortiesHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.sHdr} ${scrolled ? styles.sHdrScrolled : ""}`}>
      <div className={styles.sHdrIn}>
        <h1 className={styles.sTitle}>Sorties</h1>
        <span className={styles.sSpacer} />
        <Link href="/sorties/nouvelle" className={`${styles.sBtn} ${styles.sBtnPri}`}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5.8v12.4M5.8 12h12.4" />
          </svg>
          Nouvelle sortie
        </Link>
      </div>
    </header>
  );
}
