"use client";

import { usePathname } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";

const TITLES: Record<string, string> = {
  sorties: "Sorties",
  revenus: "Revenus",
  reglages: "Réglages",
};

export function HeaderTitle() {
  const pathname = usePathname();
  const section = pathname.split("/")[1] ?? "sorties";
  return <h2 className={styles["hdr-title"]}>{TITLES[section] ?? "Sorties"}</h2>;
}
