"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { Logo } from "@/components/brand/Logo";
import { NAV_ITEMS } from "@/components/operator/nav-items";
import { SortiesIcon, RevenusIcon, ReglagesIcon, BoutiqueIcon, OutwardIcon } from "@/components/operator/nav-icons";
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
          <Logo variant="lockup" height={36} title={null} />
        </span>
        <span className={styles.sBrandMark}>
          <Logo variant="symbol" height={34} title={null} />
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
            <Icon active={active} />
            <span className={styles.sNavLabel}>{item.label}</span>
          </Link>
        );
      })}

      {/* La boutique telle que la voient les clients : l'opérateur la montre,
          la copie dans ses confirmations. Absente de la barre d'onglets du
          téléphone, qui n'a de place que pour trois entrées. */}
      <p className={styles.sNavHead}>Vos clients</p>
      <a href={storeHref} target="_blank" rel="noopener noreferrer" className={`${styles.sNav} ${styles.sNavAside}`}>
        <BoutiqueIcon />
        <span className={styles.sNavLabel}>Ma boutique</span>
        <OutwardIcon size={16} className={styles.sNavExt} />
      </a>

      <div className={styles.sp} />

      <AccountMenu operatorName={operatorName} email={email} logoUrl={logoUrl} />
    </>
  );
}
