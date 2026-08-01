"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";

/** Recherche affichée dans la topbar, uniquement sur /sorties (même pattern que HeaderTitle). */
export function TopbarSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (value === current) return;

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) params.set("q", value);
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 200);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (pathname !== "/sorties") return null;

  return (
    <div className={styles.hdrSearch}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="search"
        placeholder="Rechercher une sortie…"
        aria-label="Rechercher une sortie"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
