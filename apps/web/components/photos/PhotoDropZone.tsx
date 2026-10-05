"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import styles from "@/app/(operator)/operator.module.css";
import { useUploadQueue } from "@/components/photos/UploadQueueProvider";

export interface PhotoDropZoneHandle {
  /** Ouvre le sélecteur de fichiers depuis un bouton placé ailleurs. */
  open: () => void;
}

/**
 * Le champ de fichiers, et rien d'autre.
 *
 * La file d'envoi vit dans UploadQueueProvider, monté une fois pour tout
 * l'espace opérateur : ce composant peut apparaître, disparaître, changer de
 * variante sans rien interrompre. C'est le montage de la file dans cet écran
 * qui a causé les deux blocages du 05/09.
 */
export function PhotoDropZone({
  sortieId,
  variant = "zone",
  controlRef,
  label,
}: {
  sortieId: string;
  variant?: "zone" | "button" | "silent";
  controlRef?: React.MutableRefObject<PhotoDropZoneHandle | null>;
  label?: string;
}) {
  const queue = useUploadQueue();
  const inputRef = useRef<HTMLInputElement>(null);
  // Le glisser-déposer : la zone l'annonçait sans le gérer, le navigateur
  // ouvrait alors le fichier lâché à la place de la page.
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  useEffect(() => {
    if (!controlRef) return;
    controlRef.current = { open: () => inputRef.current?.click() };
    return () => {
      controlRef.current = null;
    };
  }, [controlRef]);

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const chosen = Array.from(files);
    event.target.value = "";
    void queue.enqueue(sortieId, chosen);
  }

  function hasFiles(e: DragEvent): boolean {
    return Array.from(e.dataTransfer.types).includes("Files");
  }

  function onDrop(e: DragEvent<HTMLElement>): void {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    const chosen = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/") || /\.(heic|heif)$/i.test(f.name));
    if (chosen.length > 0) void queue.enqueue(sortieId, chosen);
  }

  const input = <input ref={inputRef} type="file" multiple accept="image/*,video/*" onChange={handleFilesSelected} className="hidden" />;

  if (variant === "silent") return input;

  if (variant === "button") {
    return (
      <>
        {input}
        <button type="button" className={`${styles.sBtn} ${styles.sBtnSm} ${styles.sdChip}`} onClick={() => inputRef.current?.click()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5.8v12.4M5.8 12h12.4" />
          </svg>
          <span className={styles.sdChipLabel}>{label ?? "Ajouter photos et vidéos"}</span>
        </button>
      </>
    );
  }

  return (
    <>
      {input}
      <div
        className={styles.sdDrop}
        data-dragging={dragging || undefined}
        onDragEnter={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          depth.current += 1;
          setDragging(true);
        }}
        onDragOver={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={() => {
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setDragging(false);
        }}
        onDrop={onDrop}
      >
        <svg className={styles.sdDropIc} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="15" height="13" rx="2" />
          <path d="M6 5V4.5A1.5 1.5 0 0 1 7.5 3H19.5A1.5 1.5 0 0 1 21 4.5V14.5a1.5 1.5 0 0 1-1.5 1.5H18" />
          <circle cx="8" cy="9.5" r="1.4" />
          <path d="m3.5 16 4.2-3.8a1.2 1.2 0 0 1 1.6 0L14 16.5" />
          <path d="m12 14.5 1.6-1.4a1.2 1.2 0 0 1 1.6 0L18 15.5" />
        </svg>
        <p className={styles.sdDropT}>{dragging ? "Lâchez pour importer" : (label ?? "Aucune photo")}</p>
        <p className={styles.sdDropH}>Importez les fichiers de la sortie, ou glissez-les ici.</p>
        <button type="button" className={styles.sdDropBtn} onClick={() => inputRef.current?.click()}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
            <path d="M4.5 14v4.2c0 .99.81 1.8 1.8 1.8h11.4c.99 0 1.8-.81 1.8-1.8V14" />
          </svg>
          Importer
        </button>
      </div>
    </>
  );
}
