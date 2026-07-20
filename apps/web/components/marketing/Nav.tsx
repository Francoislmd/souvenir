"use client";

import { useState } from "react";
import Link from "next/link";
import { SouvenirMark } from "@/components/SouvenirMark";

const LINKS = [
  { href: "#comment-ca-marche", label: "Fonctionnalités" },
  { href: "#revenus", label: "Revenus" },
  { href: "#cas-usage", label: "Cas d'usage" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="lp-nav">
      <Link href="/" className="lp-nav__brand" onClick={() => setOpen(false)}>
        <SouvenirMark size="sm" />
        <span className="lp-nav__word">Souvenir</span>
      </Link>

      <div className="lp-nav__right">
        <nav className="lp-nav__links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
          <a href="/login" className="is-muted">Se connecter</a>
        </nav>
        <div className="lp-nav__actions">
          <a href="/signup" className="lp-nav__btn-ghost">Voir une démo</a>
          <a href="/signup" className="lp-nav__btn-dark">Démarrer gratuitement</a>
          <button
            type="button"
            className={`lp-nav__burger${open ? " open" : ""}`}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
          </button>
        </div>
      </div>

      <div className={`lp-mobile-menu${open ? " open" : ""}`}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className="lp-mobile-menu__link" onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a href="/login" className="lp-mobile-menu__link" onClick={() => setOpen(false)}>Se connecter</a>
        <div className="lp-mobile-menu__cta">
          <a href="/signup" className="lp-nav__btn-ghost" onClick={() => setOpen(false)}>Voir une démo</a>
          <a href="/signup" className="lp-nav__btn-dark" onClick={() => setOpen(false)}>Démarrer gratuitement</a>
        </div>
      </div>
    </header>
  );
}
