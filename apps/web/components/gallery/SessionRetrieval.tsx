"use client";

import { useEffect, useState } from "react";
import styles from "@/components/gallery/gallery.module.css";
import type { GroupDaySummary, GroupSlotSummary } from "@/lib/gallery-group";

/**
 * Choisir son créneau — un seul écran.
 *
 * La version précédente en demandait trois : choisir le jour, puis
 * l'activité, puis le créneau. Or on scanne ce QR code au retour de la
 * sortie, sur le parking, pas trois semaines plus tard : le jour est déjà
 * connu. Il devient donc une pastille, préréglée sur le plus récent, et les
 * créneaux sont juste en dessous.
 *
 * Une ligne = une heure de départ, puis l'activité. On affichait avant une
 * plage (« De 9 h 00 à 11 h 00 », « À partir de 11 h 00 ») : deux formats
 * différents dans la même liste, des heures qui ne commencent pas au même
 * endroit, et une phrase à lire là où une heure suffit. L'heure est donc
 * seule, en colonne, alignée sur des chiffres de même largeur.
 */
export function SessionRetrieval({
  apiBase,
  days,
  initialDateKey,
  onPick,
}: {
  apiBase: string;
  days: GroupDaySummary[];
  initialDateKey?: string;
  onPick: (slot: GroupSlotSummary, dayLabel: string) => void;
}) {
  // Le jour du lien de sortie, quand on arrive par le QR code d'une journée
  // précise, sinon le plus récent : on scanne au retour, pas trois semaines
  // plus tard.
  const [dateKey, setDateKey] = useState(
    (initialDateKey && days.some((d) => d.dateKey === initialDateKey) ? initialDateKey : days[0]?.dateKey) ?? "",
  );
  const [slots, setSlots] = useState<GroupSlotSummary[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const activeDay = days.find((d) => d.dateKey === dateKey) ?? null;

  useEffect(() => {
    if (!dateKey) return;
    let cancelled = false;
    setState("loading");
    fetch(`${apiBase}/days/${encodeURIComponent(dateKey)}/slots`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json() as Promise<{ dateLabel: string; slots: GroupSlotSummary[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setSlots(data.slots);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [dateKey, apiBase]);

  if (days.length === 0) {
    return (
      <>
        <div className={styles.head}>
          <h1>Les photos ne sont pas encore en ligne</h1>
          <p className={styles.hint}>Elles arrivent ici après la sortie. Rouvrez ce lien plus tard, il reste valable.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.head}>
        <h1>Choisissez votre départ</h1>
        <p className={styles.hint}>Les photos sont classées par heure de départ.</p>
      </div>

      {days.length > 1 ? (
        <div className={styles.chips}>
          {days.map((day) => (
            <button
              key={day.dateKey}
              type="button"
              className={`${styles.chip} ${day.dateKey === dateKey ? styles.chipOn : ""}`}
              onClick={() => setDateKey(day.dateKey)}
            >
              {chipLabel(day)}
            </button>
          ))}
        </div>
      ) : null}

      {state === "error" ? (
        <p className={styles.empty}>Les créneaux n&rsquo;ont pas pu être chargés. Réessayez dans un instant.</p>
      ) : state === "ready" && slots.length === 0 ? (
        <p className={styles.empty}>Aucun créneau publié ce jour-là.</p>
      ) : (
        <div className={styles.slots}>
          {slots.map((slot) => (
            <button key={slot.id} type="button" className={styles.slotRow} onClick={() => onPick(slot, activeDay?.dateLabel ?? "")}>
              <span className={styles.slotH}>{slot.label}</span>
              <span className={styles.slotA}>{slot.activity}</span>
              <span className={styles.slotN}>
                {slot.photoCount} photo{slot.photoCount > 1 ? "s" : ""}
              </span>
              <svg
                className={styles.slotGo}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.5 5 16 12l-6.5 7" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Remplace un écran d'aide entier : en cas de doute, ouvrez le
          créneau le plus proche, vous vous reconnaîtrez tout de suite. */}
      <p className={styles.note}>Un doute sur l&rsquo;horaire ? Ouvrez le créneau le plus proche, vous vous reconnaîtrez tout de suite.</p>
    </>
  );
}

function chipLabel(day: GroupDaySummary): string {
  if (day.recency === "today") return "Aujourd'hui";
  if (day.recency === "yesterday") return "Hier";
  return `${day.weekday.slice(0, 3)}. ${day.dayNumber}`;
}
