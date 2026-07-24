"use client";

import Link from "next/link";
import styles from "@/app/(operator)/operator.module.css";
import { useToast } from "@/components/operator/ToastProvider";

export interface SortieRow {
  id: string;
  title: string;
  subtitle: string;
  ph: string;
  kind: "upcoming" | "past";
  amount?: string;
}

export function SortieRows({ rows, emptyLabel }: { rows: SortieRow[]; emptyLabel: string }) {
  const toast = useToast();

  if (rows.length === 0) {
    return <div className={styles.rows}><div style={{ color: "var(--ink-4)", fontSize: ".88rem" }}>{emptyLabel}</div></div>;
  }

  return (
    <div className={styles.rows}>
      {rows.map((row) =>
        row.kind === "upcoming" ? (
          <Link key={row.id} href={`/sorties/${row.id}`} className={styles.row}>
            <span className={`${styles.th} ${styles.ph} ${styles[row.ph]}`} />
            <span className={styles.info}>
              <span className={styles.ti}>{row.title}</span>
              <span className={styles.sb}>{row.subtitle}</span>
            </span>
            <span className={`${styles.pill} ${styles.wait}`}>À venir</span>
          </Link>
        ) : (
          <button key={row.id} type="button" className={styles.row} onClick={() => toast("Sortie terminée")}>
            <span className={`${styles.th} ${styles.ph} ${styles[row.ph]}`} />
            <span className={styles.info}>
              <span className={styles.ti}>{row.title}</span>
              <span className={styles.sb}>{row.subtitle}</span>
            </span>
            <span className={styles.amt}>{row.amount}</span>
          </button>
        ),
      )}
    </div>
  );
}
