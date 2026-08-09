"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import styles from "@/app/(marketing)/landing.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export type MarketingRoute = "fonctionnement" | "simulation" | "liste-attente";

interface HeaderProps {
  /** Route affichée en gras ; absent sur l'accueil (le logo fait office de lien racine). */
  current?: MarketingRoute;
}

const NAV_LINKS: { href: string; label: string; route: MarketingRoute }[] = [
  { href: "/fonctionnement", label: "Fonctionnement", route: "fonctionnement" },
  { href: "/simulation", label: "Simulation", route: "simulation" },
];

export function Header({ current }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cx(styles.header, scrolled && styles.headerScrolled)}>
      <Link href="/" aria-label="Linktrip — accueil" className="flex items-center">
        <Logo variant="lockup" height={36} />
      </Link>
      <nav className={styles.headerLinks}>
        {NAV_LINKS.map(({ href, label, route }) => (
          <Link
            key={href}
            href={href}
            className={cx(
              "text-[15.5px] text-ink-2 transition [@media(hover:hover)]:hover:text-ink",
              current === route && "font-semibold text-ink",
            )}
          >
            {label}
          </Link>
        ))}
        <button
          type="button"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className={styles.menuToggle}
        >
          <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        <ButtonLink href="/liste-attente" variant="sunset" size="md" className={styles.headerCta}>
          Rejoindre la liste d&apos;attente <span aria-hidden="true">→</span>
        </ButtonLink>
      </nav>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            className={styles.menuBackdrop}
            onClick={() => setMenuOpen(false)}
          />
          <nav id="mobile-nav-menu" className={styles.menuPanel}>
            {NAV_LINKS.map(({ href, label, route }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cx(current === route && "font-semibold text-ink")}
              >
                {label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}

export default Header;
