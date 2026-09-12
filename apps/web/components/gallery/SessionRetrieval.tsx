"use client";

import { useEffect, useState } from "react";
import styles from "@/components/gallery/gallery.module.css";
import { LoadingBlock } from "@/components/ui/Spinner";
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
  sortie,
  onPick,
}: {
  apiBase: string;
  days: GroupDaySummary[];
  // Posé quand on arrive par le lien d'une sortie précise : ses créneaux sont
  // alors déjà connus du serveur, il n'y a ni jour à choisir ni appel à faire.
  // Un même jour peut porter plusieurs sorties du même opérateur, et le lien
  // d'une sortie ne doit ouvrir que la sienne.
  sortie?: { dateLabel: string; slots: GroupSlotSummary[] };
  onPick: (slot: GroupSlotSummary, dayLabel: string) => void;
}) {
  // Le jour le plus récent : on scanne le QR code au retour de la sortie, pas
  // trois semaines plus tard.
  const [dateKey, setDateKey] = useState(days[0]?.dateKey ?? "");
  const [slots, setSlots] = useState<GroupSlotSummary[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const activeDay = days.find((d) => d.dateKey === dateKey) ?? null;
  const shownSlots = sortie ? sortie.slots : slots;
  const shownLabel = sortie ? sortie.dateLabel : (activeDay?.dateLabel ?? "");

  useEffect(() => {
    if (sortie || !dateKey) return;
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
  }, [dateKey, apiBase, sortie]);

  if (!sortie && days.length === 0) {
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
        {sortie ? <p className={styles.sub}>{sortie.dateLabel.replace(/^./, (c) => c.toUpperCase())}</p> : null}
        <p className={styles.hint}>Les photos sont classées par heure de départ.</p>
      </div>

      {!sortie && days.length > 1 ? (
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

      {!sortie && state === "loading" ? (
        // Les créneaux arrivent par le réseau, sur un téléphone et souvent en
        // 4G de bord de mer : sans moulinette, la place reste vide et le
        // client croit que sa sortie n'est pas là.
        <LoadingBlock label="Chargement des créneaux…" />
      ) : !sortie && state === "error" ? (
        <p className={styles.empty}>Les créneaux n&rsquo;ont pas pu être chargés. Réessayez dans un instant.</p>
      ) : !sortie && state === "ready" && slots.length === 0 ? (
        <p className={styles.empty}>Aucun créneau publié ce jour-là.</p>
      ) : (
        <div className={styles.slots}>
          {shownSlots.map((slot) => (
            <button key={slot.id} type="button" className={styles.slotRow} onClick={() => onPick(slot, shownLabel)}>
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
