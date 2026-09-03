"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/app/(operator)/operator.module.css";
import { formatEuros } from "@/lib/format";
import { ActivityGlyph } from "@/components/sorties/ActivityGlyph";
import type { PublicationStatus } from "@/lib/sorties";

export interface SortieRow {
  id: string;
  startsAt: string;
  activity: string;
  place: string | null;
  guide: string | null;
  participantCount: number;
  photoCount: number;
  revenueCents: number;
  publicationStatus: PublicationStatus;
}

const PAGE = 8;

const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function midnight(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Aujourd'hui", "Hier", sinon "Samedi 12 septembre". Regrouper par jour
 *  évite de répéter la date sur chaque ligne. */
function dayLabel(d: Date, now: Date): { title: string; detail: string } {
  const diff = Math.round((midnight(d) - midnight(now)) / 86400000);
  const full = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  if (diff === 0) return { title: "Aujourd'hui", detail: full };
  if (diff === -1) return { title: "Hier", detail: full };
  if (diff === 1) return { title: "Demain", detail: full };
  return { title: full.charAt(0).toUpperCase() + full.slice(1), detail: "" };
}

function timeLabel(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function meta(row: SortieRow, d: Date): string {
  const bits = [timeLabel(d)];
  if (row.guide) bits.push(row.guide);
  if (row.participantCount > 0) {
    bits.push(`${row.participantCount} participant${row.participantCount > 1 ? "s" : ""}`);
  }
  return bits.join(" · ");
}

export function SortiesList({ rows, now }: { rows: SortieRow[]; now: string }) {
  const [visible, setVisible] = useState(PAGE);
  const today = new Date(now);

  if (rows.length === 0) {
    return (
      <div className={styles.sEmpty}>
        <h2>Aucune sortie pour l&rsquo;instant</h2>
        <p>Créez-en une, vos guides y déposeront les photos dès la fin de l&rsquo;activité.</p>
        <Link href="/sorties/nouvelle" className={`${styles.sBtn} ${styles.sBtnPri}`}>
          Créer une sortie
        </Link>
      </div>
    );
  }

  const shown = rows.slice(0, visible);
  const groups: { key: string; title: string; detail: string; items: SortieRow[] }[] = [];

  shown.forEach((row) => {
    const d = new Date(row.startsAt);
    const { title, detail } = dayLabel(d, today);
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.items.push(row);
    else groups.push({ key: `${title}-${row.id}`, title, detail, items: [row] });
  });

  return (
    <>
      {groups.map((group) => (
        <div key={group.key}>
          <p className={styles.sDay}>
            {group.title}
            {group.detail ? <em> · {group.detail}</em> : null}
          </p>
          <div className={styles.sGroup}>
            {group.items.map((row) => {
              const d = new Date(row.startsAt);
              const title = row.place ? `${row.activity}, ${row.place}` : row.activity;
              const glyph = (
                <span className={styles.sTh}>
                  <ActivityGlyph activity={row.activity} />
                </span>
              );
              const main = (
                <span className={styles.sMain}>
                  <b>{title}</b>
                  <span>{meta(row, d)}</span>
                </span>
              );

              // Une sortie sans photo porte son action : c'est une règle, pas
              // un cas particulier de la sortie du jour.
              if (row.photoCount === 0) {
                return (
                  <div key={row.id} className={styles.sRow}>
                    {glyph}
                    {main}
                    <span className={styles.sVal}>
                      <Link href={`/sorties/${row.id}/photos`} className={`${styles.sBtn} ${styles.sBtnInk} ${styles.sBtnSm}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 19V6" />
                          <path d="M6 12l6-6 6 6" />
                        </svg>
                        Ajouter les photos
                      </Link>
                    </span>
                  </div>
                );
              }

              return (
                <Link key={row.id} href={`/sorties/${row.id}`} className={styles.sRow}>
                  {glyph}
                  {main}
                  <span className={`${styles.sVal} ${row.revenueCents === 0 ? styles.sValZero : ""}`}>
                    <b>{formatEuros(row.revenueCents)}</b>
                    <span>
                      {row.photoCount} photo{row.photoCount > 1 ? "s" : ""}{" "}
                      {row.publicationStatus === "online" ? "en ligne" : "à publier"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {rows.length > visible ? (
        <button type="button" className={styles.sMore} onClick={() => setVisible((n) => n + PAGE)}>
          Afficher les sorties plus anciennes
        </button>
      ) : null}
    </>
  );
}
