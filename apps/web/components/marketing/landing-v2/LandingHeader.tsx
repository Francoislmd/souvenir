"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoOcean } from "./LogoOcean";
import styles from "@/app/(marketing)/landing-v2.module.css";

const NAV = [
  { href: "#fonctionnement", label: "Fonctionnement" },
  { href: "#tarif", label: "Tarif" },
  { href: "#simulateur", label: "Simulateur" },
  { href: "#faq", label: "FAQ" },
];

/** En-tête de la landing : liens d'ancre sur ordinateur, volet sous 760 px. */
export function LandingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={styles.header}>
      <div className={`${styles.wrap} ${styles.headRow}`}>
        <Link href="/" aria-label="Linktrip, accueil" className={styles.brand}>
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
            type="button"
            className={styles.burger}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="lt-volet"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open ? (
        <nav id="lt-volet" className={styles.drawer} aria-label="Menu">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} onClick={close}>
              {l.label}
            </a>
          ))}
          <Link href="/connexion" onClick={close}>
            Connexion
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
