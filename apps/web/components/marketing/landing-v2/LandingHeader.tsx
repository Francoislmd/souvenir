"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogoOcean } from "./LogoOcean";
import styles from "@/app/(marketing)/landing-v2.module.css";

const NAV = [
  { href: "#fonctionnement", label: "Fonctionnement" },
  { href: "#tarif", label: "Tarif" },
  { href: "#simulateur", label: "Simulateur" },
  { href: "#faq", label: "FAQ" },
];

/** Au-delà, le volet n'existe plus : la barre montre les liens. Aligné sur la media query de landing-v2.module.css. */
const DESKTOP = "(min-width: 761px)";

function lockScroll(on: boolean) {
  document.documentElement.style.overflow = on ? "hidden" : "";
}

/**
 * En-tête de la landing : liens d'ancre sur ordinateur, volet sous 760 px.
 * Le volet couvre tout l'écran sous la barre ; la page ne défile plus
 * derrière ; Échap, un lien ou le passage en grand écran le referment.
 */
export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  /** Ouvert au clavier (Entrée, Espace) : seul cas où le focus descend dans le volet. Au doigt, Safari dessinerait l'anneau de focus sur le premier lien. */
  const byKeyboard = useRef(false);

  const close = useCallback((refocus = false) => {
    lockScroll(false);
    setOpen(false);
    if (refocus) burgerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    if (byKeyboard.current) firstLinkRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(true);
    const mq = window.matchMedia(DESKTOP);
    const onMq = () => mq.matches && close();
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open, close]);

  return (
    <header className={styles.header} data-open={open || undefined}>
      <div className={`${styles.wrap} ${styles.headRow}`}>
        <Link href="/" aria-label="Linktrip, accueil" className={styles.brand} onClick={() => close()}>
          <LogoOcean height={30} />
        </Link>
        <nav className={styles.nav} aria-label="Navigation principale">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} className={styles.navLink}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className={styles.headActions}>
          <Link href="/connexion" className={styles.login}>
            Connexion
          </Link>
          <Link href="/signup" className={`${styles.btn} ${styles.primary} ${styles.headCta}`}>
            Créer un compte
          </Link>
          <button
            ref={burgerRef}
            type="button"
            className={styles.burger}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="lt-volet"
            onClick={(e) => {
              if (open) return close();
              byKeyboard.current = e.detail === 0;
              setOpen(true);
            }}
          >
            <span className={styles.burgerLines} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      <nav id="lt-volet" className={styles.drawer} aria-label="Menu" aria-hidden={!open}>
        <ul className={styles.drawerList}>
          {NAV.map((l, i) => (
            <li key={l.href}>
              <a href={l.href} ref={i === 0 ? firstLinkRef : undefined} tabIndex={open ? 0 : -1} onClick={() => close()}>
                {l.label}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
        <div className={styles.drawerFoot}>
          <div className={styles.drawerCta}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing-v2/rafting-drone.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" />
            <span className={styles.drawerShade} aria-hidden="true" />
            <p className={styles.drawerCtaTitle}>Prêt à vendre vos photos ?</p>
            <p className={styles.drawerCtaText}>Créez votre compte en 3 minutes.</p>
            <Link href="/signup" tabIndex={open ? 0 : -1} className={`${styles.btn} ${styles.white}`} onClick={() => close()}>
              Créer un compte gratuit
            </Link>
          </div>
          <Link href="/connexion" tabIndex={open ? 0 : -1} className={`${styles.btn} ${styles.ghost}`} onClick={() => close()}>
            Connexion
          </Link>
        </div>
      </nav>
    </header>
  );
}
