"use client";

import styles from "@/app/(operator)/operator.module.css";

export interface LanePhoto {
  id: string;
  thumbUrl: string | null;
  ownerId: string | null;
}

export interface LaneParticipant {
  id: string;
  name: string;
}

export const AV_VARIANTS = ["", "b", "c"];

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Thumb({ photo, selected, onToggle }: { photo: LanePhoto; selected: boolean; onToggle: (photoId: string) => void }) {
  return (
    <span
      className={`${styles.th2} ${selected ? styles["th2-selected"] : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onToggle(photo.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(photo.id);
        }
      }}
    >
      {photo.thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.thumbUrl} alt="" draggable={false} />
      ) : null}
      <span className={`${styles["th2-check"]} ${selected ? styles.on : ""}`}>
        <CheckIcon />
      </span>
    </span>
  );
}

/**
 * Répartition calculée automatiquement au dépôt, affichée voie par voie
 * (une par participant + une pour les photos communes). Pour corriger : on
 * sélectionne une ou plusieurs vignettes (tap), puis on les attribue à un
 * participant ou à tous via la barre d'action sous la grille (voir
 * PhotosFlow, qui porte l'état de sélection).
 */
export function AssignmentLanes({
  photos,
  participants,
  selected,
  onToggleSelect,
}: {
  photos: LanePhoto[];
  participants: LaneParticipant[];
  selected: Set<string>;
  onToggleSelect: (photoId: string) => void;
}) {
  const common = photos.filter((p) => p.ownerId === null);

  return (
    <div>
      {participants.map((participant, i) => {
        const mine = photos.filter((p) => p.ownerId === participant.id);
        const variant = AV_VARIANTS[i % 3];
        return (
          <div key={participant.id} className={styles.lane}>
            <div className={styles["lane-h"]}>
              <span className={`${styles.av} ${variant ? styles[variant] : ""}`} style={{ width: 29, height: 29, fontSize: ".7rem" }}>
                {participant.name.slice(0, 2).toUpperCase()}
              </span>
              <span className={styles.nm}>{participant.name}</span>
              <span className={styles.qt}>{mine.length}</span>
            </div>
            <div className={styles.thumbs}>
              {mine.length === 0 ? (
                <span style={{ fontSize: ".8rem", color: "var(--ink-4)" }}>Aucune photo</span>
              ) : (
                mine.map((p) => <Thumb key={p.id} photo={p} selected={selected.has(p.id)} onToggle={onToggleSelect} />)
              )}
            </div>
          </div>
        );
      })}

      <div className={`${styles.lane} ${styles.common}`}>
        <div className={styles["lane-h"]}>
          <span className={styles.av} style={{ width: 29, height: 29, fontSize: ".64rem", background: "var(--ink-3)" }}>
            TS
          </span>
          <span className={styles.nm}>Photos communes</span>
          <span className={styles.qt}>{common.length} · à tous</span>
        </div>
        <div className={styles.thumbs}>
          {common.map((p) => (
            <Thumb key={p.id} photo={p} selected={selected.has(p.id)} onToggle={onToggleSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}
