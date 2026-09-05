"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "@/app/(operator)/operator.module.css";

/**
 * Le même en-tête pour les quatre écrans de l'espace opérateur.
 *
 * Avant, chaque page avait le sien : deux d'entre elles seulement portaient
 * l'ombre au défilement, le titre changeait de taille d'un écran à l'autre, et
 * le retour était posé au-dessus du titre — la ligne de titre descendait donc
 * de vingt pixels dès qu'on entrait dans une sortie. Ici le retour est un
 * bouton sur la ligne du titre : le titre garde exactement la même place,
 * quel que soit l'écran.
 */
export function AppHeader({
  title,
  backHref,
  backLabel,
  status,
  action,
}: {
  title: string;
  backHref?: string;
  /** Ce que le retour ramène, pour le lecteur d'écran et l'infobulle. */
  backLabel?: string;
  status?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);

  // L'ombre n'apparaît qu'une fois la page défilée : elle dit que l'en-tête
  // flotte au-dessus du contenu, elle ne décore pas le haut de page.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.sHdr} ${scrolled ? styles.sHdrScrolled : ""}`}>
      <div className={styles.sHdrIn}>
        {backHref ? (
          <Link href={backHref} className={styles.sBack} aria-label={backLabel ?? "Retour"} title={backLabel ?? "Retour"}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.5 5 8 12l6.5 7" />
            </svg>
          </Link>
        ) : null}

        <h1 className={styles.sTitle} title={title}>
          {title}
        </h1>

        <span className={styles.sSpacer} />
        {status}
        {action}
      </div>
    </header>
  );
}
