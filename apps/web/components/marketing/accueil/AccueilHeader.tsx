"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoOcean } from "@/components/marketing/landing-v2/LogoOcean";
import s from "@/app/(marketing)/accueil.module.css";

const NAV = [
  { href: "#pourquoi", label: "Pourquoi Linktrip" },
  { href: "#solution", label: "Solutions" },
  { href: "/produit", label: "Produit" },
  { href: "#simulateur", label: "Simulateur" },
  { href: "#faq", label: "FAQ" },
];

/** En-tête fixe : barre flottante sur ordinateur, logo + menu dépliant sous 760 px. */
export function AccueilHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 761px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  return (
    <header className={s.header}>
      <div className={s.headRow}>
        <Link href="/" aria-label="Linktrip, accueil" className={s.brand} onClick={() => setOpen(false)}>
          <LogoOcean height={28} />
        </Link>
        <nav className={s.nav} aria-label="Navigation principale">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} className={s.navLink}>
              {l.label}
            </a>
          ))}
        </nav>
        <Link href="/connexion" className={s.login}>
          Se connecter
        </Link>
        <Link href="/signup" className={`${s.btn} ${s.primary} ${s.headCta}`}>
          Créer un compte
          <Arrow />
        </Link>
        <button
          type="button"
          className={s.burger}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="accueil-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      <nav id="accueil-menu" className={s.drawer} aria-label="Menu" hidden={!open}>
        {NAV.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <Link href="/connexion" onClick={() => setOpen(false)}>
          Se connecter
        </Link>
        <Link href="/signup" className={`${s.btn} ${s.primary}`} onClick={() => setOpen(false)}>
          Créer un compte gratuit
        </Link>
      </nav>
    </header>
  );
}

export function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
