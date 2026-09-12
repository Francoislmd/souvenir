"use client";

import { useEffect, useState } from "react";
import styles from "@/components/gallery/gallery.module.css";
import { BackLink } from "@/components/gallery/BackLink";
import { LoadingBlock } from "@/components/ui/Spinner";
import type { GroupDaySummary, GroupSlotSummary } from "@/lib/gallery-group";

/**
 * Choisir son créneau : le jour, puis l'heure de départ.
 *
 * Le jour était une rangée de pastilles posée au-dessus des créneaux,
 * préréglée sur le plus récent. Deux listes sur le même écran, et surtout
 * aucun moyen de reculer : le client tombé sur le mauvais jour n'avait
 * qu'un lien « Changer de créneau » glissé au milieu d'une phrase d'aide.
 * Le jour est donc un écran à lui seul, et tout le parcours recule de la
 * même façon, par la flèche posée au-dessus du titre.
 *
 * Un seul jour publié — ou l'arrivée par le lien d'une sortie précise — et
 * cet écran saute : on ouvre directement les heures de départ, sans retour
 * puisqu'il n'y a rien derrière.
 *
 * Une ligne = une heure de départ, puis l'activité. On affichait avant une
 * plage (« De 9 h 00 à 11 h 00 », « À partir de 11 h 00 ») : deux formats
 * différents dans la même liste, des heures qui ne commencent pas au même
 * endroit, et une phrase à lire là où une heure suffit. L'heure est donc
 * seule, en colonne, alignée sur des chiffres de même largeur.
 *
 * Le jour choisi et l'étape vivent chez GroupGallery : cet écran est
 * démonté dès qu'une grille de photos s'ouvre, et le retour doit ramener
 * là où le client était, pas au début.
 */
export function SessionRetrieval({
  apiBase,
  days,
  sortie,
  dateKey,
  onDateKey,
  step,
  onStep,
  onPick,
}: {
  apiBase: string;
  days: GroupDaySummary[];
  // Posé quand on arrive par le lien d'une sortie précise : ses créneaux sont
  // alors déjà connus du serveur, il n'y a ni jour à choisir ni appel à faire.
  // Un même jour peut porter plusieurs sorties du même opérateur, et le lien
  // d'une sortie ne doit ouvrir que la sienne.
  sortie?: { dateLabel: string; slots: GroupSlotSummary[] };
  dateKey: string;
  onDateKey: (key: string) => void;
  step: "days" | "slots";
  onStep: (step: "days" | "slots") => void;
  onPick: (slot: GroupSlotSummary, dayLabel: string) => void;
}) {
  const [slots, setSlots] = useState<GroupSlotSummary[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const activeDay = days.find((d) => d.dateKey === dateKey) ?? null;
  const shownSlots = sortie ? sortie.slots : slots;
  const shownLabel = sortie ? sortie.dateLabel : (activeDay?.dateLabel ?? "");
  // Rien derrière l'écran des heures quand le jour n'a jamais été demandé.
  const canGoBack = !sortie && days.length > 1;

  useEffect(() => {
    if (sortie || !dateKey || step !== "slots") return;
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
  }, [dateKey, apiBase, sortie, step]);

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

  if (!sortie && step === "days") {
    return (
      <>
        <div className={styles.head}>
          <h1>Choisissez votre jour</h1>
          <p className={styles.hint}>Les heures de départ arrivent juste après.</p>
        </div>
        <div className={styles.slots}>
          {days.map((day) => (
            <button
              key={day.dateKey}
              type="button"
              className={styles.slotRow}
              onClick={() => {
                onDateKey(day.dateKey);
                onStep("slots");
              }}
            >
              <span className={styles.dayH}>{dayTitle(day)}</span>
              <span className={styles.slotN}>
                {day.sessionCount} créneau{day.sessionCount > 1 ? "x" : ""}
              </span>
              <GoIcon />
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.head}>
        {canGoBack ? <BackLink onClick={() => onStep("days")} /> : null}
        <h1>Choisissez votre départ</h1>
        {shownLabel ? <p className={styles.sub}>{shownLabel.replace(/^./, (c) => c.toUpperCase())}</p> : null}
        <p className={styles.hint}>Les photos sont classées par heure de départ.</p>
      </div>

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
              <GoIcon />
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

function GoIcon() {
  return (
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
      aria-hidden="true"
    >
      <path d="M9.5 5 16 12l-6.5 7" />
    </svg>
  );
}

// « Aujourd'hui » et « Hier » se lisent plus vite qu'une date, et ce sont
// les deux seuls jours où le QR code est vraiment scanné. Pour les autres,
// le jour de la semaine est abrégé : « Dimanche 6 septembre » se fait
// couper par les points de suspension sur un téléphone, « Dim. 6 septembre »
// tient entier à côté du nombre de créneaux.
function dayTitle(day: GroupDaySummary): string {
  if (day.recency === "today") return "Aujourd'hui";
  if (day.recency === "yesterday") return "Hier";
  const [weekday, ...rest] = day.dateLabel.split(" ");
  if (rest.length === 0) return day.dateLabel.replace(/^./, (c) => c.toUpperCase());
  return `${weekday.slice(0, 3).replace(/^./, (c) => c.toUpperCase())}. ${rest.join(" ")}`;
}
