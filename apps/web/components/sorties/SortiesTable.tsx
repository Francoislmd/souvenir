"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { formatEuros, formatDateShortFr } from "@/lib/format";
import { getActivityVisual } from "@/lib/activity-visuals";
import { StatusTag } from "@/components/sorties/StatusTag";
import type { PublicationStatus } from "@/lib/sorties";

export interface SortieTableRow {
  id: string;
  startsAt: Date;
  activity: string;
  place: string | null;
  guide: string | null;
  photoCount: number;
  revenueCents: number;
  publicationStatus: PublicationStatus;
}

const PERIODS = [
  { key: "30", label: "30 jours", days: 30 },
  { key: "90", label: "3 mois", days: 90 },
  { key: "all", label: "Tout", days: null },
] as const;

const PAGE_SIZE = 8;

function formatTimeFr(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
}

export function SortiesTable({ rows }: { rows: SortieTableRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const period = searchParams.get("period") ?? "30";
  const activityFilter = searchParams.get("activity") ?? "all";

  const activities = useMemo(() => Array.from(new Set(rows.map((r) => r.activity))).sort(), [rows]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === "all" || value === "") params.delete(key);
    else params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setVisibleCount(PAGE_SIZE);
  }

  const filtered = useMemo(() => {
    const activePeriod = PERIODS.find((p) => p.key === period) ?? PERIODS[0];
    const cutoff = activePeriod.days != null ? Date.now() - activePeriod.days * 24 * 60 * 60 * 1000 : null;

    return rows
      .filter((r) => (cutoff == null ? true : r.startsAt.getTime() >= cutoff))
      .filter((r) => (activityFilter === "all" ? true : r.activity === activityFilter))
      .filter((r) => {
        if (!q) return true;
        return [r.activity, r.place, r.guide].some((v) => v?.toLowerCase().includes(q));
      })
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
  }, [rows, period, activityFilter, q]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visible.length;

  return (
    <>
      <div className={styles.toolbar}>
        <h3 className={styles.lbl}>Toutes les sorties</h3>
        <div className={styles.seg} role="group" aria-label="Période">
          {PERIODS.map((p) => (
            <button key={p.key} type="button" aria-pressed={period === p.key} onClick={() => setParam("period", p.key)}>
              {p.label}
            </button>
          ))}
        </div>
        <select
          className={styles.select}
          aria-label="Filtrer par activité"
          value={activityFilter}
          onChange={(e) => setParam("activity", e.target.value)}
        >
          <option value="all">Toutes les activités</option>
          {activities.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.tbl}>
        <div className={`${styles.trow} ${styles.thead}`}>
          <span>Date</span>
          <span>Activité</span>
          <span className={`${styles.tmid} ${styles["col-photos"]}`}>Photos</span>
          <span className={styles.tmid}>Revenus</span>
          <span className={styles["col-statut"]}>Statut</span>
          <span></span>
        </div>

        {visible.length === 0 ? (
          <div style={{ padding: "24px 20px", color: "var(--ink-4)", fontSize: ".88rem" }}>
            Aucune sortie ne correspond à ces filtres.
          </div>
        ) : (
          visible.map((row) => {
            const visual = getActivityVisual(row.activity);
            return (
              <Link key={row.id} href={`/sorties/${row.id}`} className={styles.trow}>
                <span className={styles.tcell}>
                  <b>{formatDateShortFr(row.startsAt)}</b>
                  <small>{formatTimeFr(row.startsAt)}</small>
                </span>
                <span className={styles.tact}>
                  <span className={styles.ttile} style={{ background: visual.tint }}>
                    {visual.emoji}
                  </span>
                  <span>
                    <b className={styles.ti}>
                      {row.activity}
                      {row.place ? ` · ${row.place}` : ""}
                    </b>
                    <small className={styles.sb}>{row.guide ? `guide ${row.guide}` : "Sans guide"}</small>
                  </span>
                </span>
                <span className={`${styles.tmid} ${styles["col-photos"]} ${row.photoCount === 0 ? styles.zero : ""}`}>
                  <b>{row.photoCount}</b>
                </span>
                <span className={`${styles.tmid} ${row.revenueCents === 0 ? styles.zero : ""}`}>
                  <b>{formatEuros(row.revenueCents)}</b>
                </span>
                <span className={styles["col-statut"]}>
                  <StatusTag status={row.publicationStatus} />
                </span>
                <span className={styles.tgo}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            );
          })
        )}

        <div className={styles.tfoot}>
          <span>
            {visible.length} sortie{visible.length > 1 ? "s" : ""} sur {filtered.length}
          </span>
          {hasMore ? (
            <button type="button" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
              Afficher tout
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
