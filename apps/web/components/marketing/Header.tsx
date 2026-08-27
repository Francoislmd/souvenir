"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { ACTIVITY_ICONS } from "@/components/marketing/ActivityIcons";
import { MILIEUX, parMilieu } from "@/components/marketing/activitesNav";
import styles from "@/app/(marketing)/landing.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export type MarketingRoute = "activites" | "produit" | "tarifs" | "liste-attente";

interface HeaderProps {
  /** Route affichée en gras ; absent sur l'accueil (le logo fait office de lien racine). */
  current?: MarketingRoute;
}

/* Deux entrées : /produit a absorbé /fonctionnement (la démo) et /simulation
   (le simulateur), tous deux redirigés en 301 vers ses ancres dans
   next.config.mjs ; /tarifs porte la grille depuis le 27/08/2026. Les quatorze
   pages /activites/<slug> passent par le volet ci-dessous : elles n'ont pas de
   page d'index qui pourrait tenir en un lien. */
const NAV_LINKS: { href: string; label: string; route: MarketingRoute }[] = [
  { href: "/produit", label: "Produit", route: "produit" },
  { href: "/tarifs", label: "Tarif", route: "tarifs" },
];

function Chevron() {
  return (
    <svg
      className={styles.navChevron}
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function LienActivite({ slug, nom, onClick }: { slug: string; nom: string; onClick: () => void }) {
  const Pictogramme = ACTIVITY_ICONS[slug as keyof typeof ACTIVITY_ICONS] as ComponentType<SVGProps<SVGSVGElement>>;
  return (
    <Link className={styles.panelItem} href={`/activites/${slug}`} onClick={onClick}>
      <Pictogramme />
      <span>{nom}</span>
    </Link>
  );
}

export function Header({ current }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [accOpen, setAccOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelId = useId();
  const accId = useId();
  const barre = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Le volet se ferme au clic hors de la barre et à Échap : un menu de
     navigation qui ne se ferme qu'en recliquant sur son propre bouton reste
     ouvert par-dessus la page dès que le visiteur vise autre chose. */
  useEffect(() => {
    if (!panelOpen) return;
    const auClic = (e: MouseEvent) => {
      if (!barre.current?.contains(e.target as Node)) setPanelOpen(false);
    };
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("mousedown", auClic);
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("mousedown", auClic);
      document.removeEventListener("keydown", auClavier);
    };
  }, [panelOpen]);

  const fermerVolet = useCallback(() => setPanelOpen(false), []);
  const fermerMenu = useCallback(() => {
    setMenuOpen(false);
    setAccOpen(false);
  }, []);

  return (
    <header ref={barre} className={cx(styles.header, scrolled && styles.headerScrolled)}>
      <Link href="/" aria-label="Linktrip — accueil" className="flex items-center">
        <Logo variant="lockup" height={36} />
      </Link>
      <nav className={styles.headerLinks}>
        <button
          type="button"
          className={cx(styles.navBtn, current === "activites" && styles.navBtnCurrent)}
          aria-expanded={panelOpen}
          aria-controls={panelId}
          onClick={() => setPanelOpen((open) => !open)}
        >
          Activités
          <Chevron />
        </button>
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

      {/* Volet des activités : bandeau à la largeur de la barre, ancré au
          .header (position:relative sur desktop). Masqué sous 1000px, où les
          quatorze noms passent par l'accordéon du menu déroulant. */}
      <div id={panelId} className={styles.panel} hidden={!panelOpen}>
        <div className={styles.panelCols}>
          <div className={styles.panelIntro}>
            <p className={styles.panelKicker}>Une page par activité</p>
            <h2 className={styles.panelTitle}>Le vocabulaire de votre métier, pas le nôtre.</h2>
            <p className={styles.panelLead}>
              Chaque page reprend le déroulé d&apos;une journée, ses créneaux et ses questions.
            </p>
          </div>
          <div className={styles.panelGroups}>
            {MILIEUX.map(({ cle, titre }) => (
              <div key={cle} className={cx(styles.panelGroup, cle === "eau" && styles.panelGroupEau)}>
                <h3 className={styles.panelGroupTitle}>{titre}</h3>
                <div className={styles.panelList}>
                  {parMilieu(cle).map((a) => (
                    <LienActivite key={a.slug} slug={a.slug} nom={a.nom} onClick={fermerVolet} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className={styles.panelNote}>
          Vous ne trouvez pas votre activité ?{" "}
          <Link href="/liste-attente" onClick={fermerVolet}>
            Parlons-en.
          </Link>
        </p>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            className={styles.menuBackdrop}
            onClick={fermerMenu}
          />
          <nav id="mobile-nav-menu" className={styles.menuPanel}>
            {/* Les quatorze activités tiennent dans un accordéon plutôt que
                dans quatorze lignes : le menu resterait plus haut que l'écran
                et les deux autres entrées passeraient sous le pli. */}
            <div className={styles.menuAcc}>
              <button
                type="button"
                aria-expanded={accOpen}
                aria-controls={accId}
                onClick={() => setAccOpen((open) => !open)}
                className={cx(current === "activites" && "text-ink")}
              >
                Activités
                <Chevron />
              </button>
              <div id={accId} className={styles.menuAccList} hidden={!accOpen}>
                {parMilieu("eau").concat(parMilieu("air"), parMilieu("terre")).map((a) => (
                  <LienActivite key={a.slug} slug={a.slug} nom={a.nom} onClick={fermerMenu} />
                ))}
              </div>
            </div>
            {NAV_LINKS.map(({ href, label, route }) => (
              <Link
                key={href}
                href={href}
                onClick={fermerMenu}
                className={cx(current === route && "font-semibold text-ink")}
              >
                {label}
              </Link>
            ))}
            {/* CTA repris ici : masqué dans la barre sous 1000px (cf. .headerCta),
                il reste accessible depuis le menu déroulant. */}
            <ButtonLink
              href="/liste-attente"
              variant="sunset"
              size="md"
              className={styles.menuCta}
              onClick={fermerMenu}
            >
              Rejoindre la liste d&apos;attente <span aria-hidden="true">→</span>
            </ButtonLink>
          </nav>
        </>
      )}
    </header>
  );
}

export default Header;
