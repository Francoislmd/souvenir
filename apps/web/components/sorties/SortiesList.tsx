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
  paidCount: number;
  isGroup: boolean;
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
  if (row.photoCount > 0 && row.publicationStatus === "pending") {
    bits.push(`${row.photoCount} photo${row.photoCount > 1 ? "s" : ""} déposée${row.photoCount > 1 ? "s" : ""}`);
  } else if (row.participantCount > 0) {
    bits.push(`${row.participantCount} participant${row.participantCount > 1 ? "s" : ""}`);
  }
  return bits.join(" · ");
}

/** Ce que la ligne dit une fois la galerie en ligne : le résultat, jamais
 *  une redite de l'état. Sans achat, le montant reste en gris — c'est une
 *  information, pas une alerte. */
function outcome(row: SortieRow): { value: string; sub: string; muted: boolean } {
  if (row.paidCount === 0) {
    return { value: formatEuros(0), sub: "en ligne", muted: true };
  }
  const plural = row.paidCount > 1 ? "s" : "";
  const denominator = !row.isGroup && row.participantCount > 0 ? ` sur ${row.participantCount}` : "";
  return { value: formatEuros(row.revenueCents), sub: `${row.paidCount} achat${plural}${denominator}`, muted: false };
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V6" />
      <path d="M6 12l6-6 6 6" />
    </svg>
  );
}

export function SortiesList({ rows, now }: { rows: SortieRow[]; now: string }) {
  const [visible, setVisible] = useState(PAGE);
  const today = new Date(now);

  if (rows.length === 0) {
    return (
      <div className={styles.sEmpty}>
        <h2>Votre première sortie</h2>
        <p>Notez-la maintenant, même si elle est demain. Les photos viendront après, en deux minutes.</p>
        <div className={styles.sSteps}>
          <span className={styles.sStep}>
            <b>1</b>
            <i>Vous créez la sortie</i>
            <em>L&rsquo;activité et la date. Rien d&rsquo;autre.</em>
          </span>
          <span className={styles.sStep}>
            <b>2</b>
            <i>Vous déposez les photos</i>
            <em>Toute la carte mémoire, sans trier.</em>
          </span>
          <span className={styles.sStep}>
            <b>3</b>
            <i>Vos clients les reçoivent</i>
            <em>Un lien, et vous êtes payé le vendredi.</em>
          </span>
        </div>
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

              // La règle de la liste : tant qu'une sortie doit quelque chose,
              // sa ligne porte un bouton ; une fois publiée, elle porte son
              // résultat.
              //
              // Le bouton ne dépend pas de la date. Une première version le
              // masquait sur les sorties à venir — « elles ne doivent encore
              // rien » — et la ligne devenait inerte : après avoir créé une
              // sortie pour le lendemain, plus rien dans la liste ne disait
              // qu'on pouvait y déposer des photos. L'opérateur note souvent
              // sa sortie la veille et revient avec la carte mémoire ; il n'y
              // a pas de bascule « c'est aujourd'hui » dans sa tête.
              // "Publier" n'a de sens qu'en mode GROUPE (une galerie unique) —
              // en INDIVIDUEL l'action réelle est d'envoyer à des clients, et
              // encore faut-il en avoir un : la fiche sortie ne montre même pas
              // de bouton tant que la liste est vide, la ligne ne devrait pas
              // promettre un « Publier » qui n'existe pas derrière.
              let action: string | null = null;
              if (row.photoCount === 0) action = "Ajouter les photos";
              else if (row.publicationStatus === "pending") {
                if (row.isGroup) action = "Publier les photos";
                else if (row.participantCount === 0) action = "Ajouter des clients";
                else action = `Envoyer à ${row.participantCount} client${row.participantCount > 1 ? "s" : ""}`;
              }

              const result = action === null && row.publicationStatus === "online" ? outcome(row) : null;

              return (
                <Link key={row.id} href={`/sorties/${row.id}`} className={styles.sRow}>
                  <span className={styles.sTh}>
                    <ActivityGlyph activity={row.activity} />
                  </span>
                  <span className={styles.sMain}>
                    <b>{title}</b>
                    <span>{meta(row, d)}</span>
                  </span>
                  {action ? (
                    <span className={styles.sRowAct}>
                      <span className={styles.sdChip}>
                        {action === "Ajouter les photos" ? <UploadIcon /> : null}
                        {action}
                      </span>
                    </span>
                  ) : result ? (
                    <span className={`${styles.sVal} ${result.muted ? styles.sValZero : ""}`}>
                      <b>{result.value}</b>
                      <span>{result.sub}</span>
                    </span>
                  ) : null}
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
