"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "@/app/(operator)/operator.module.css";
import { Logo } from "@/components/brand/Logo";
import { NAV_ITEMS } from "@/components/operator/nav-items";
import { SortiesIcon, RevenusIcon, ReglagesIcon } from "@/components/operator/nav-icons";

const ICONS = { sorties: SortiesIcon, revenus: RevenusIcon, reglages: ReglagesIcon };

/**
 * Le bandeau de marque du téléphone.
 *
 * Sur grand écran, la colonne de gauche porte le logo et le compte. Sous
 * 760 px elle devient la barre d'onglets du bas, qui n'a de place ni pour
 * l'un ni pour l'autre : l'espace pro n'affichait plus rien de la marque, et
 * le nom de l'opérateur n'apparaissait nulle part.
 *
 * Ce bandeau les remet en haut — le symbole à gauche, le menu à droite — et
 * **défile avec la page** plutôt que de rester collé : la ligne de titre,
 * elle, reste en haut. Il ne coûte donc ses 56 px qu'une fois.
 *
 * Le menu s'ouvre en feuille basse, celle de « Nouvelle sortie »
 * (.shOverlay / .shPanel), au lieu d'un tiroir latéral : c'est le geste déjà
 * appris ailleurs dans le produit, et le pouce l'atteint.
 */
export function MobileTopBar({ operatorName, email }: { operatorName: string; email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Changer d'écran referme le menu : sans ça il resterait ouvert au-dessus
  // de la page d'arrivée.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Échap referme, et la page ne défile pas derrière la feuille.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <div className={styles.sTop}>
        <Link href="/sorties" className={styles.sTopMark} aria-label="Linktrip">
          <Logo variant="symbol" height={26} title={null} />
        </Link>
        <span className={styles.sTopSpacer} />
        <button
          type="button"
          className={styles.sBurger}
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className={styles.shOverlay} onClick={() => setOpen(false)} role="presentation">
          <div
            className={styles.shPanel}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <span className={styles.shGrip} aria-hidden="true" />

            <span className={styles.sMenuAcct}>
              <span className={styles.sAv}>{operatorName.slice(0, 2).toUpperCase()}</span>
              <span className={styles.sMenuWho}>
                <b>{operatorName}</b>
                <em>{email}</em>
              </span>
            </span>

            {NAV_ITEMS.map((item) => {
              const Icon = ICONS[item.key];
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.sMenuNav} ${active ? styles.sMenuNavOn : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon active={active} />
                  {item.label}
                </Link>
              );
            })}

            <form action="/auth/signout" method="post">
              <button type="submit" className={styles.sMenuOut}>
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
