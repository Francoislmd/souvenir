"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "#solution", label: "Produit" },
  { href: "#steps", label: "Fonctionnement" },
  { href: "#revenus", label: "Revenus" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="lp-nav">
      <Link href="/" className="lp-nav__brand" onClick={() => setOpen(false)}>
        <span className="lp-nav__word">Linktrip</span>
      </Link>

      <div className="lp-nav__right">
        <nav className="lp-nav__links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>
        <div className="lp-nav__actions">
          <a href="/connexion" className="lp-nav__btn-ghost">Se connecter</a>
          <a href="/signup" className="lp-nav__btn-dark">Créer ma boutique</a>
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
        <a href="/connexion" className="lp-mobile-menu__link" onClick={() => setOpen(false)}>Se connecter</a>
        <div className="lp-mobile-menu__cta">
          <a href="/signup" className="lp-nav__btn-dark" onClick={() => setOpen(false)}>Créer ma boutique</a>
        </div>
      </div>
    </header>
  );
}
