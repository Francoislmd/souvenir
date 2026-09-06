"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
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

  const input = <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFilesSelected} className="hidden" />;

  if (variant === "silent") return input;

  if (variant === "button") {
    return (
      <>
        {input}
        <button type="button" className={`${styles.sBtn} ${styles.sBtnSm} ${styles.sdChip}`} onClick={() => inputRef.current?.click()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5.8v12.4M5.8 12h12.4" />
          </svg>
          <span className={styles.sdChipLabel}>{label ?? "Ajouter des photos"}</span>
        </button>
      </>
    );
  }

  return (
    <>
      {input}
      <button type="button" className={styles.sdDrop} onClick={() => inputRef.current?.click()}>
        <span className={styles.sdDropIc}>
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 17V4.5" />
            <path d="M6.5 10 12 4.5 17.5 10" />
            <path d="M4 15.5v2.8A2.2 2.2 0 0 0 6.2 20.5h11.6a2.2 2.2 0 0 0 2.2-2.2v-2.8" />
          </svg>
        </span>
        <span className={styles.sdDropT}>{label ?? "Déposez les photos de la sortie"}</span>
        <span className={styles.sdDropH}>Videz la carte mémoire d&rsquo;un coup. Glissez-les ici, ou choisissez-les sur l&rsquo;appareil.</span>
        <span className={`${styles.sBtn} ${styles.sBtnPri}`}>Choisir les photos</span>
      </button>
    </>
  );
}
