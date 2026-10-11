"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { SaleSheet } from "@/components/revenus/SaleSheet";

export interface SaleRow {
  id: string;
  name: string;
  /** « HydroSpeed · hier », composé côté serveur. */
  line: string;
  amount: string;
}

/** « Qui a acheté » : chaque ligne ouvre le détail de l'achat en fenêtre. */
export function SalesList({ rows }: { rows: SaleRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<SaleRow | null>(null);

  if (rows.length === 0) return <p className={styles.sdNote}>Aucun achat pour l&rsquo;instant.</p>;

  return (
    <>
      {rows.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`${styles.sdClient} ${styles.rvRow}`}
          onClick={() => setOpen(s)}
          aria-haspopup="dialog"
        >
          <span className={styles.sdAv}>{s.name.slice(0, 2).toUpperCase()}</span>
          <span className={styles.sdClientMain}>
            <b>{s.name}</b>
            <span>{s.line}</span>
          </span>
          <span className={styles.rvAmount}>{s.amount}</span>
        </button>
      ))}
      {open ? <SaleSheet orderId={open.id} title={open.name} onClose={() => setOpen(null)} onChanged={() => router.refresh()} /> : null}
    </>
  );
}
