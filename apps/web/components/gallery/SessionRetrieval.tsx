"use client";

import styles from "@/components/gallery/gallery.module.css";
import type { GroupSlotSummary } from "@/lib/gallery-group";

/**
 * Choisir son créneau — un seul écran.
 *
 * Il y en a eu trois : choisir le jour, puis l'activité, puis le créneau. Le
 * jour est tombé quand le lien est passé de l'opérateur à la sortie : le code
 * de store.linktrip.co/{slug}/{code} désigne une sortie et une seule, donc la
 * date est connue avant même l'ouverture de la page. Elle est rappelée sous
 * le titre, et il ne reste que les créneaux.
 *
 * Une ligne = une heure de départ, puis l'activité. On affichait avant une
 * plage (« De 9 h 00 à 11 h 00 », « À partir de 11 h 00 ») : deux formats
 * différents dans la même liste, des heures qui ne commencent pas au même
 * endroit, et une phrase à lire là où une heure suffit. L'heure est donc
 * seule, en colonne, alignée sur des chiffres de même largeur.
 */
export function SessionRetrieval({
  dateLabel,
  slots,
  onPick,
}: {
  dateLabel: string;
  slots: GroupSlotSummary[];
  onPick: (slot: GroupSlotSummary) => void;
}) {
  return (
    <>
      <div className={styles.head}>
        <h1>Choisissez votre départ</h1>
        <p className={styles.sub}>{dateLabel.replace(/^./, (c) => c.toUpperCase())}</p>
        <p className={styles.hint}>Les photos sont classées par heure de départ.</p>
      </div>

      <div className={styles.slots}>
        {slots.map((slot) => (
          <button key={slot.id} type="button" className={styles.slotRow} onClick={() => onPick(slot)}>
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

      {/* Remplace un écran d'aide entier : en cas de doute, ouvrez le
          créneau le plus proche, vous vous reconnaîtrez tout de suite. */}
      <p className={styles.note}>Un doute sur l&rsquo;horaire ? Ouvrez le créneau le plus proche, vous vous reconnaîtrez tout de suite.</p>
    </>
  );
}
