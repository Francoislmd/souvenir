"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { Logo } from "@/components/brand/Logo";
import { NAV_ITEMS } from "@/components/operator/nav-items";
import { SortiesIcon, RevenusIcon, ReglagesIcon } from "@/components/operator/nav-icons";

const ICONS = { sorties: SortiesIcon, revenus: RevenusIcon, reglages: ReglagesIcon };

export function NavList({ operatorName, badgeCount }: { operatorName: string; badgeCount: number }) {
  const pathname = usePathname();

  return (
    <>
      <Link href="/sorties" className={styles.sBrand} aria-label="Linktrip">
        <Logo variant="lockup" height={27} title={null} />
      </Link>

      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.key];
        const active = pathname.startsWith(item.href);
        const count = item.key === "sorties" ? badgeCount : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.sNav} ${active ? styles.sNavOn : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon />
            <span className={styles.sNavLabel}>{item.label}</span>
            {count > 0 ? <span className={styles.sNavCount}>{count}</span> : null}
          </Link>
        );
      })}

      <div className={styles.sp} />

      <form action="/auth/signout" method="post">
        <button type="submit" className={styles.sAcct} title="Se déconnecter">
          <span className={styles.sAv}>{operatorName.slice(0, 2).toUpperCase()}</span>
          <span className={styles.sWho}>
            <b>{operatorName}</b>
            <span>Se déconnecter</span>
          </span>
        </button>
      </form>
    </>
  );
}
