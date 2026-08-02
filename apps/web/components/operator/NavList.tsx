"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { Logo } from "@/components/brand/Logo";
import { NAV_ITEMS } from "@/components/operator/nav-items";
import { SortiesIcon, RevenusIcon, ReglagesIcon } from "@/components/operator/nav-icons";

const ICONS = { sorties: SortiesIcon, revenus: RevenusIcon, reglages: ReglagesIcon };

export function NavList({
  operatorName,
  badgeCount,
  onNavigate,
}: {
  operatorName: string;
  badgeCount: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className={styles.logoRow}>
        <Link href="/sorties" className={styles.logo} onClick={onNavigate}>
          <Logo height={34} />
        </Link>
        {onNavigate ? (
          <button type="button" className={styles.drawerClose} aria-label="Fermer le menu" onClick={onNavigate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.key];
        const active = pathname.startsWith(item.href);
        const badge = item.key === "sorties" ? badgeCount : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.nv} ${active ? styles.on : ""}`}
            onClick={onNavigate}
          >
            <Icon />
            {item.label}
            {badge > 0 ? <span className={styles.navBadge}>{badge}</span> : null}
          </Link>
        );
      })}

      <div className={styles.sp} />

      <div className={styles.who}>
        <span className={styles["av-who"]}>{operatorName.slice(0, 2).toUpperCase()}</span>
        <div>
          <span className={styles.nm}>{operatorName}</span>
          <span className={styles.rl}>Compte opérateur</span>
        </div>
      </div>
      <form action="/auth/signout" method="post">
        <button type="submit" className={styles.signout}>
          Se déconnecter
        </button>
      </form>
    </>
  );
}
