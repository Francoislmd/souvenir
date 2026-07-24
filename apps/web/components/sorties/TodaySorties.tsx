"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/app/(operator)/operator.module.css";
import { formatEuros } from "@/lib/format";
import type { Sortie } from "@souvenir/db";

export type TodaySortie = Sortie & {
  _count: { participants: number };
  participants: { openedAt: Date | null; order: { status: string; amountCents: number } | null }[];
};

function formatTimeFr(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
}

export function TodaySorties({ sorties }: { sorties: TodaySortie[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className={styles.rows}>
      {sorties.map((sortie) => {
        const open = openId === sortie.id;
        const regCount = sortie._count.participants;
        const sent = sortie.status === "SENT";
        const header = (
          <span className={styles.info}>
            <span className={styles.ti}>
              {sortie.activity}
              {sortie.place ? ` · ${sortie.place}` : ""}
            </span>
            <span className={styles.sb}>
              {formatTimeFr(sortie.startsAt)} · {regCount} client{regCount > 1 ? "s" : ""} sur {sortie.seats} places
            </span>
          </span>
        );

        if (!open) {
          return (
            <button key={sortie.id} type="button" className={styles.row} onClick={() => setOpenId(sortie.id)} aria-expanded={false}>
              {header}
              <span className={`${styles.pill} ${sent ? styles.paid : styles.wait}`}>{sent ? "Envoyée" : "Aujourd’hui"}</span>
            </button>
          );
        }

        return (
          <div key={sortie.id} className={styles.today}>
            <div className={styles["today-in"]}>
              <button type="button" className={styles["today-head"]} onClick={() => setOpenId(null)} aria-expanded={true}>
                {header}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m18 15-6-6-6 6" />
                </svg>
              </button>

              {sent ? (
                <div className={styles.trio}>
                  <div className={styles.tri}>
                    <div className={styles.k}>Ont regardé</div>
                    <div className={styles.v}>
                      {sortie.participants.filter((p) => p.openedAt).length}/{regCount}
                    </div>
                  </div>
                  <div className={styles.tri}>
                    <div className={styles.k}>Ont acheté</div>
                    <div className={styles.v}>{sortie.participants.filter((p) => p.order?.status === "succeeded").length}</div>
                  </div>
                  <div className={styles.tri}>
                    <div className={styles.k}>Ventes</div>
                    <div className={`${styles.v} ${styles.grad}`}>
                      {formatEuros(sortie.participants.reduce((sum, p) => sum + (p.order?.status === "succeeded" ? p.order.amountCents : 0), 0))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className={styles.state}>
                    <b>{regCount}</b>
                    <span>
                      client{regCount > 1 ? "s" : ""} sur {sortie.seats} places
                    </span>
                  </div>
                  <div className={styles.track}>
                    <i style={{ width: `${Math.min(100, (regCount / sortie.seats) * 100)}%` }} />
                  </div>
                </div>
              )}

              <Link href={`/sorties/${sortie.id}`} className={`${styles.btn} ${styles.full}`} style={{ marginTop: 18 }}>
                {sent ? "Voir où en sont les ventes" : "Voir mes clients"}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
