"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { Logo } from "@/components/brand/Logo";
import { NAV_ITEMS } from "@/components/operator/nav-items";
import { SortiesIcon, RevenusIcon, ReglagesIcon } from "@/components/operator/nav-icons";

const ICONS = { sorties: SortiesIcon, revenus: RevenusIcon, reglages: ReglagesIcon };

export function Sidebar({ operatorName }: { operatorName: string }) {
  const pathname = usePathname();

  return (
    <aside className={styles.side}>
      <Link href="/sorties" className={styles.logo}>
        <Logo height={34} />
      </Link>

      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.key];
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`${styles.nv} ${active ? styles.on : ""}`}>
            <Icon />
            {item.label}
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
    </aside>
  );
}
