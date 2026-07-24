"use client";

import { useRef, useState } from "react";
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

const AV_VARIANTS = ["", "b", "c"];
const COMMON = "__common__";
const DRAG_THRESHOLD_PX = 6;

/**
 * Répartition calculée automatiquement au dépôt — les vignettes restent
 * informatives par défaut, mais chacune peut être glissée vers une autre
 * voie (participant ou "Communes") pour corriger une erreur avant l'envoi.
 * Pointer Events plutôt que l'API drag-and-drop HTML5 : un seul code path
 * pour souris et tactile.
 */
export function AssignmentLanes({
  photos,
  participants,
  editable = false,
  onReassign,
}: {
  photos: LanePhoto[];
  participants: LaneParticipant[];
  editable?: boolean;
  onReassign?: (photoId: string, ownerId: string | null) => void;
}) {
  const common = photos.filter((p) => p.ownerId === null);

  const [dragPhotoId, setDragPhotoId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [overLane, setOverLane] = useState<string | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const movedPastThreshold = useRef(false);
  const activePointerId = useRef<number | null>(null);

  const draggedPhoto = photos.find((p) => p.id === dragPhotoId) ?? null;

  function reset(): void {
    setDragPhotoId(null);
    setDragPos(null);
    setOverLane(null);
    startPos.current = null;
    movedPastThreshold.current = false;
    activePointerId.current = null;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLSpanElement>, photoId: string): void {
    if (!editable) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointerId.current = e.pointerId;
    startPos.current = { x: e.clientX, y: e.clientY };
    movedPastThreshold.current = false;
    setDragPhotoId(photoId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLSpanElement>): void {
    if (!dragPhotoId || e.pointerId !== activePointerId.current) return;

    if (!movedPastThreshold.current && startPos.current) {
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      movedPastThreshold.current = true;
    }

    setDragPos({ x: e.clientX, y: e.clientY });
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const laneEl = el?.closest<HTMLElement>("[data-lane-id]");
    setOverLane(laneEl?.dataset.laneId ?? null);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLSpanElement>): void {
    if (!dragPhotoId || e.pointerId !== activePointerId.current) return;

    if (movedPastThreshold.current && overLane) {
      const nextOwnerId = overLane === COMMON ? null : overLane;
      const photo = photos.find((p) => p.id === dragPhotoId);
      if (photo && photo.ownerId !== nextOwnerId) {
        onReassign?.(dragPhotoId, nextOwnerId);
      }
    }
    reset();
  }

  function Thumb({ photo }: { photo: LanePhoto }) {
    const isDragging = dragPhotoId === photo.id && movedPastThreshold.current;
    return (
      <span
        className={`${styles.th2} ${editable ? styles["th2-draggable"] : ""} ${isDragging ? styles["th2-dragging"] : ""}`}
        onPointerDown={(e) => handlePointerDown(e, photo.id)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={reset}
      >
        {photo.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.thumbUrl} alt="" draggable={false} />
        ) : null}
      </span>
    );
  }

  return (
    <div>
      {participants.map((participant, i) => {
        const mine = photos.filter((p) => p.ownerId === participant.id);
        const variant = AV_VARIANTS[i % 3];
        return (
          <div
            key={participant.id}
            className={`${styles.lane} ${overLane === participant.id ? styles["lane-drop-target"] : ""}`}
            data-lane-id={participant.id}
          >
            <div className={styles["lane-h"]}>
              <span className={`${styles.av} ${variant ? styles[variant] : ""}`} style={{ width: 29, height: 29, fontSize: ".7rem" }}>
                {participant.name.slice(0, 2).toUpperCase()}
              </span>
              <span className={styles.nm}>{participant.name}</span>
              <span className={styles.qt}>{mine.length}</span>
            </div>
            <div className={`${styles.thumbs} ${overLane === participant.id ? styles["thumbs-drop-target"] : ""}`}>
              {mine.length === 0 ? (
                <span style={{ fontSize: ".8rem", color: "var(--ink-4)" }}>Aucune photo</span>
              ) : (
                mine.map((p) => <Thumb key={p.id} photo={p} />)
              )}
            </div>
          </div>
        );
      })}

      <div
        className={`${styles.lane} ${styles.common} ${overLane === COMMON ? styles["lane-drop-target"] : ""}`}
        data-lane-id={COMMON}
      >
        <div className={styles["lane-h"]}>
          <span className={styles.av} style={{ width: 29, height: 29, fontSize: ".64rem", background: "var(--ink-3)" }}>
            TS
          </span>
          <span className={styles.nm}>Photos communes</span>
          <span className={styles.qt}>{common.length} · à tous</span>
        </div>
        <div className={`${styles.thumbs} ${overLane === COMMON ? styles["thumbs-drop-target"] : ""}`}>
          {common.map((p) => (
            <Thumb key={p.id} photo={p} />
          ))}
        </div>
      </div>

      {editable && draggedPhoto && dragPos && movedPastThreshold.current ? (
        <div className={styles["drag-ghost"]} style={{ left: dragPos.x, top: dragPos.y }}>
          {draggedPhoto.thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draggedPhoto.thumbUrl} alt="" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
