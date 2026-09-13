"use client";

import { useState } from "react";
import styles from "@/components/gallery/store.module.css";
import gallery from "@/components/gallery/gallery.module.css";
import { LoadingBlock } from "@/components/ui/Spinner";
import type { GroupDaySummary, GroupSlotSummary } from "@/lib/gallery-group";

/**
 * Les deux écrans d'entrée de la boutique : le jour, puis l'heure de départ.
 *
 * L'accueil s'ouvre sur la couverture du prestataire et son nom : un client
 * qui vient de scanner un QR code vérifie d'abord qu'il est au bon endroit,
 * et une photo le dit avant un titre. Les jours sont des dates, pas des
 * vignettes : ce que le client cherche est sa date, une photo d'activité
 * prise un autre jour ne l'aide pas à la trouver.
 *
 * L'écran du jour garde le jour écrit en haut et le laisse changer sur
 * place : ouvrir le mauvais jour est le cas courant, pas l'exception. Les
 * onglets filtrent par activité (une journée mélange canyoning et via
 * ferrata) et n'apparaissent que s'il y a plus d'une activité à départager.
 *
 * Ce composant ne garde qu'un état, l'activité affichée, qui ne désigne pas
 * un écran : le jour et le créneau restent tenus par GroupGallery, aligné
 * sur l'URL, pour qu'un lien s'ouvre, se partage et se mette en favori.
 */
export function SessionRetrieval({
  operator,
  days,
  dateKey,
  dayLabel,
  slots,
  state,
  canGoBack,
  onDay,
  onSlot,
  onBack,
}: {
  operator: { name: string; logoUrl: string | null; coverUrl: string | null; tagline: string };
  days: GroupDaySummary[];
  // Vide = on est sur l'accueil.
  dateKey: string;
  dayLabel: string;
  slots: GroupSlotSummary[];
  state: "loading" | "ready" | "error";
  canGoBack: boolean;
  onDay: (day: GroupDaySummary) => void;
  onSlot: (slot: GroupSlotSummary) => void;
  onBack: () => void;
}) {
  const [activity, setActivity] = useState("");
  const [switching, setSwitching] = useState(false);

  if (!dateKey) return <Home operator={operator} days={days} onDay={onDay} />;

  const activities = Array.from(new Set(slots.map((s) => s.activity)));
  const shown = activity && activities.includes(activity) ? [activity] : activities;

  return (
    <>
      <div className={styles.bar}>
        {canGoBack ? (
          <button type="button" className={styles.barBtn} onClick={onBack} aria-label="Revenir au choix du jour">
            <ChevronIcon direction="left" size={21} />
          </button>
        ) : (
          <span className={styles.barSpacer} />
        )}
        {canGoBack ? (
          <button type="button" className={styles.barTitle} aria-expanded={switching} onClick={() => setSwitching((v) => !v)}>
            {capitalize(dayLabel)}
            <ChevronIcon direction="down" size={17} />
          </button>
        ) : (
          <span className={`${styles.barTitle} ${styles.barTitleStatic}`}>{capitalize(dayLabel)}</span>
        )}
        <span className={styles.barSpacer} />
      </div>

      {switching ? (
        <div className={styles.switch}>
          {days.map((day) => (
            <button
              key={day.dateKey}
              type="button"
              className={styles.switchRow}
              aria-current={day.dateKey === dateKey}
              onClick={() => {
                setSwitching(false);
                setActivity("");
                onDay(day);
              }}
            >
              <b>{capitalize(day.dateLabel)}</b>
              <i>{countLabel(day.sessionCount, "créneau", "créneaux")}</i>
            </button>
          ))}
        </div>
      ) : null}

      {activities.length > 1 ? (
        <div className={styles.tabs} role="tablist" aria-label="Activités du jour">
          <button type="button" role="tab" className={styles.tab} aria-selected={shown.length > 1} onClick={() => setActivity("")}>
            Tout
          </button>
          {activities.map((a) => (
            <button key={a} type="button" role="tab" className={styles.tab} aria-selected={shown.length === 1 && shown[0] === a} onClick={() => setActivity(a)}>
              {a}
            </button>
          ))}
        </div>
      ) : null}

      {state === "loading" ? (
        // Les créneaux arrivent par le réseau, sur un téléphone et souvent en
        // 4G de bord de mer : sans moulinette, la place reste vide et le
        // client croit que sa sortie n'est pas là.
        <LoadingBlock label="Chargement des créneaux…" />
      ) : state === "error" ? (
        <p className={gallery.empty}>Les créneaux n&rsquo;ont pas pu être chargés. Réessayez dans un instant.</p>
      ) : slots.length === 0 ? (
        <p className={gallery.empty}>Aucun créneau publié ce jour-là.</p>
      ) : (
        <div className={styles.list}>
          {shown.map((a) => (
            <div key={a}>
              {shown.length > 1 ? <h2 className={styles.sec}>{a}</h2> : null}
              {slots
                .filter((s) => s.activity === a)
                .map((slot) => (
                  <button key={slot.id} type="button" className={styles.row} onClick={() => onSlot(slot)}>
                    <span className={styles.rowTxt}>
                      {slot.pending ? <span className={`${styles.state} ${styles.stateWait}`}>Aperçus en préparation</span> : null}
                      <span className={styles.rowH}>{slot.label}</span>
                      <span className={styles.rowN}>{countLabel(slot.photoCount, "photo", "photos")}</span>
                      {slot.guide ? <span className={styles.rowG}>Guide : {slot.guide}</span> : null}
                    </span>
                    <span className={styles.rowThumb}>
                      {slot.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={slot.coverUrl} alt="" loading="lazy" />
                      ) : null}
                      <span className={styles.go} aria-hidden="true">
                        <ChevronIcon direction="right" size={15} stroke={2.4} />
                      </span>
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}

      {/* Remplace un écran d'aide entier : en cas de doute, ouvrez le
          créneau le plus proche, vous vous reconnaîtrez tout de suite. */}
      <p className={gallery.note}>Un doute sur l&rsquo;horaire ? Ouvrez le créneau le plus proche, vous vous reconnaîtrez tout de suite.</p>
    </>
  );
}

/** L'accueil : la couverture, le prestataire, ses jours. */
function Home({
  operator,
  days,
  onDay,
}: {
  operator: { name: string; logoUrl: string | null; coverUrl: string | null; tagline: string };
  days: GroupDaySummary[];
  onDay: (day: GroupDaySummary) => void;
}) {
  return (
    <>
      {operator.coverUrl ? (
        <div className={styles.cover}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={operator.coverUrl} alt="" />
          <ShareButton name={operator.name} />
        </div>
      ) : null}

      <div className={`${styles.sheet} ${operator.coverUrl ? "" : styles.noCover}`}>
        <div className={styles.badge}>
          {operator.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={operator.logoUrl} alt="" />
          ) : (
            operator.name.slice(0, 2).toUpperCase()
          )}
        </div>

        <div className={styles.id}>
          <h1>{operator.name}</h1>
          {operator.tagline ? <p>{operator.tagline}</p> : null}
        </div>

        <div className={styles.label}>
          <h2>Choisissez votre jour</h2>
          <p>Les heures de départ arrivent juste après.</p>
        </div>

        <div className={styles.days}>
          {days.map((day) => (
            <button
              key={day.dateKey}
              type="button"
              className={`${styles.day} ${day.recency === "today" ? styles.dayNow : ""}`}
              onClick={() => onDay(day)}
            >
              <span className={styles.dayWhen}>{dayWhen(day)}</span>
              <span className={styles.dayNum}>{day.dayNumber}</span>
              <span className={styles.dayMonth}>{monthName(day.dateLabel)}</span>
              <span className={styles.dayN}>{countLabel(day.sessionCount, "créneau", "créneaux")}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * Partager l'adresse de la boutique : c'est le geste du client qui a fait la
 * sortie à plusieurs et envoie le lien au reste du groupe. Sans le partage
 * natif (ordinateur de bureau), l'adresse part dans le presse-papiers et le
 * bouton le dit, faute de quoi rien ne se passe visiblement.
 */
function ShareButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  async function share(): Promise<void> {
    const url = window.location.origin + window.location.pathname;
    if (navigator.share) {
      await navigator.share({ title: name, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" className={styles.share} onClick={() => void share()} aria-label={copied ? "Lien copié" : "Partager le lien de la boutique"}>
      {copied ? (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 15V4" />
          <path d="m8 7.5 4-3.5 4 3.5" />
          <path d="M5 12.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6.5" />
        </svg>
      )}
    </button>
  );
}

function ChevronIcon({ direction, size, stroke = 1.9 }: { direction: "left" | "right" | "down"; size: number; stroke?: number }) {
  const d = direction === "left" ? "M14.5 5 8 12l6.5 7" : direction === "right" ? "M9.5 5 16 12l-6.5 7" : "m6 9.5 6 6 6-6";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function capitalize(s: string): string {
  return s.replace(/^./, (c) => c.toUpperCase());
}

function countLabel(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}

// « Aujourd'hui » et « Hier » se lisent plus vite qu'une date, et ce sont les
// deux seuls jours où le QR code est vraiment scanné. Les autres gardent leur
// jour de la semaine, au-dessus du quantième.
function dayWhen(day: GroupDaySummary): string {
  if (day.recency === "today") return "Aujourd'hui";
  if (day.recency === "yesterday") return "Hier";
  return day.weekday;
}

// « dimanche 13 septembre » → « septembre ». Le quantième est déjà affiché
// en gros au-dessus, et l'année n'existe pas dans la fenêtre de rétention.
function monthName(dateLabel: string): string {
  const parts = dateLabel.split(" ");
  return parts.slice(2).join(" ") || dateLabel;
}
