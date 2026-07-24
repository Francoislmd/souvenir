"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { NAV_ITEMS } from "@/components/operator/nav-items";
import { SortiesIcon, RevenusIcon, ReglagesIconSimple } from "@/components/operator/nav-icons";

const ICONS = { sorties: SortiesIcon, revenus: RevenusIcon, reglages: ReglagesIconSimple };

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.tabbar}>
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.key];
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`${styles.tb} ${active ? styles.on : ""}`}>
            <Icon size={20} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
