"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { Logo } from "@/components/brand/Logo";
import { NAV_ITEMS } from "@/components/operator/nav-items";
import { SortiesIcon, RevenusIcon, ReglagesIcon } from "@/components/operator/nav-icons";
import { AccountMenu } from "@/components/operator/AccountMenu";

const ICONS = { sorties: SortiesIcon, revenus: RevenusIcon, reglages: ReglagesIcon };

export function NavList({
  operatorName,
  email,
  logoUrl,
  storeHref,
}: {
  operatorName: string;
  email: string;
  logoUrl: string | null;
  storeHref: string;
}) {
  const pathname = usePathname();

  return (
    <>
      <Link href="/sorties" className={styles.sBrand} aria-label="Linktrip">
        {/* Le logo complet, et le symbole seul pour la colonne réduite
            (1120 px et moins) où le nom ne tient pas. */}
        <span className={styles.sBrandFull}>
          <Logo variant="lockup" height={24} title={null} />
        </span>
        <span className={styles.sBrandMark}>
          <Logo variant="symbol" height={26} title={null} />
        </span>
      </Link>

      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.key];
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.sNav} ${active ? styles.sNavOn : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon />
            <span className={styles.sNavLabel}>{item.label}</span>
          </Link>
        );
      })}

      {/* La boutique telle que la voient les clients : l'opérateur la montre,
          la copie dans ses confirmations. Absente de la barre d'onglets du
          téléphone, qui n'a de place que pour trois entrées. */}
      <p className={styles.sNavHead}>Vos clients</p>
      <a href={storeHref} target="_blank" rel="noopener noreferrer" className={`${styles.sNav} ${styles.sNavAside}`}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9.5 5.4 5a2 2 0 0 1 1.9-1.4h9.4A2 2 0 0 1 18.6 5L20 9.5" />
          <path d="M4 9.5h16v1a3 3 0 0 1-5.3 1.9A3 3 0 0 1 12 13.5a3 3 0 0 1-2.7-1.1A3 3 0 0 1 4 10.5v-1Z" />
          <path d="M5.5 13.2V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-5.8" />
        </svg>
        <span className={styles.sNavLabel}>Ma boutique</span>
        <svg className={styles.sNavExt} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 16 16 8M9 8h7v7" />
        </svg>
      </a>

      <div className={styles.sp} />

      <AccountMenu operatorName={operatorName} email={email} logoUrl={logoUrl} />
    </>
  );
}
