"use client";

import styles from "@/components/gallery/gallery.module.css";
import { BackLink } from "@/components/gallery/BackLink";
import { LoadingBlock } from "@/components/ui/Spinner";
import type { GroupDaySummary, GroupSlotSummary } from "@/lib/gallery-group";

/**
 * Choisir son créneau : le jour, puis l'heure de départ. Deux écrans, une
 * seule liste à chaque fois.
 *
 * Le jour était une rangée de pastilles posée au-dessus des créneaux,
 * préréglée sur le plus récent. Deux listes sur le même écran, et surtout
 * aucun moyen de reculer : le client tombé sur le mauvais jour n'avait
 * qu'un lien « Changer de créneau » glissé au milieu d'une phrase d'aide.
 * Le jour est donc un écran à lui seul, et tout le parcours recule de la
 * même façon, par la flèche posée au-dessus du titre.
 *
 * Ce composant ne garde aucun état : le jour, le créneau et le chargement
 * viennent de GroupGallery, qui les tient alignés sur l'URL. Un écran de
 * cette boutique doit pouvoir s'ouvrir directement, se partager et se
 * mettre en favori.
 *
 * Une ligne = une heure de départ, puis l'activité. On affichait avant une
 * plage (« De 9 h 00 à 11 h 00 », « À partir de 11 h 00 ») : deux formats
 * différents dans la même liste, des heures qui ne commencent pas au même
 * endroit, et une phrase à lire là où une heure suffit. L'heure est donc
 * seule, en colonne, alignée sur des chiffres de même largeur.
 */
export function SessionRetrieval({
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
  days: GroupDaySummary[];
  // Vide = on est sur l'écran du jour.
  dateKey: string;
  dayLabel: string;
  slots: GroupSlotSummary[];
  state: "loading" | "ready" | "error";
  canGoBack: boolean;
  onDay: (day: GroupDaySummary) => void;
  onSlot: (slot: GroupSlotSummary) => void;
  onBack: () => void;
}) {
  if (!dateKey) {
    return (
      <>
        <div className={styles.head}>
          <h1>Choisissez votre jour</h1>
          <p className={styles.hint}>Les heures de départ arrivent juste après.</p>
        </div>
        <div className={styles.slots}>
          {days.map((day) => (
            <button key={day.dateKey} type="button" className={styles.slotRow} onClick={() => onDay(day)}>
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
        {canGoBack ? <BackLink onClick={onBack} /> : null}
        <h1>Choisissez votre départ</h1>
        {dayLabel ? <p className={styles.sub}>{dayLabel.replace(/^./, (c) => c.toUpperCase())}</p> : null}
        <p className={styles.hint}>Les photos sont classées par heure de départ.</p>
      </div>

      {state === "loading" ? (
        // Les créneaux arrivent par le réseau, sur un téléphone et souvent en
        // 4G de bord de mer : sans moulinette, la place reste vide et le
        // client croit que sa sortie n'est pas là.
        <LoadingBlock label="Chargement des créneaux…" />
      ) : state === "error" ? (
        <p className={styles.empty}>Les créneaux n&rsquo;ont pas pu être chargés. Réessayez dans un instant.</p>
      ) : slots.length === 0 ? (
        <p className={styles.empty}>Aucun créneau publié ce jour-là.</p>
      ) : (
        <div className={styles.slots}>
          {slots.map((slot) => (
            <button key={slot.id} type="button" className={styles.slotRow} onClick={() => onSlot(slot)}>
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
