"use client";

import { useEffect, useState } from "react";
import styles from "@/app/linktrip.module.css";
import { Logo } from "@/components/brand/Logo";

export function LinktripNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#solution", label: "Produit" },
    { href: "#steps", label: "Fonctionnement" },
    { href: "#revenus", label: "Revenus" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
      <div className={styles.navInner}>
        <a href="#top" className={styles.brand}>
          <Logo height={34} />
        </a>
        <nav className={styles.navMenu}>
          {links.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>
        <div className={styles.navActions}>
          <a href="/connexion" className={`${styles.btn} ${styles.btnGhost}`}>Se connecter</a>
          <a href="/signup" className={`${styles.btn} ${styles.btnPrimary}`}>Créer ma boutique</a>
          <button
            type="button"
            className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
          </button>
        </div>
      </div>

      <div className={`${styles.mobileMenu} ${open ? styles.mobileMenuOpen : ""}`}>
        {links.map((l) => (
          <a key={l.href} href={l.href} className={styles.mlink} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a href="/connexion" className={styles.mlink} onClick={() => setOpen(false)}>Se connecter</a>
        <div className={styles.mcta}>
          <a href="/connexion" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setOpen(false)}>Se connecter</a>
          <a href="/signup" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setOpen(false)}>Créer ma boutique</a>
        </div>
      </div>
    </header>
  );
}
