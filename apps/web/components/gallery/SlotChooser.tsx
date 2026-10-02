"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/gallery/gallery.module.css";
import { Spinner } from "@/components/ui/Spinner";

export interface ChoosableSlot {
  id: string;
  /** « 10 h » */
  hour: string;
  activity: string;
  photoCount: number;
}

/**
 * Le premier écran d'une galerie privée de groupe, quand la sortie a eu
 * plusieurs départs : le client dit le sien, une fois pour toutes. Aucune
 * vignette : ce serait montrer les photos d'un autre groupe à quelqu'un qui
 * n'en fait pas partie. Maquette : docs/maquette-galerie-privee-v1.html.
 */
export function SlotChooser({ token, dayLabel, slots }: { token: string; dayLabel: string; slots: ChoosableSlot[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(slotId: string): Promise<void> {
    if (pending) return;
    setPending(slotId);
    setError(null);
    try {
      const res = await fetch(`/api/g/${token}/slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId }),
      });
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setError("Le réseau a coupé. Réessayez.");
      setPending(null);
    }
  }

  return (
    <>
      <div className={styles.head}>
        <h1>À quelle heure êtes-vous parti&nbsp;?</h1>
        <p className={styles.sub}>{dayLabel}</p>
        <p className={styles.hint}>Vous ne verrez que les photos de votre départ. Ce choix est fait une fois pour toutes.</p>
      </div>
      <div className={styles.slots}>
        {slots.map((slot) => (
          <button key={slot.id} type="button" className={styles.slotRow} onClick={() => void choose(slot.id)} disabled={!!pending}>
            <span className={styles.slotH}>{slot.hour}</span>
            <span className={styles.slotA}>{slot.activity}</span>
            <span className={styles.slotN}>
              {slot.photoCount} photo{slot.photoCount > 1 ? "s" : ""}
            </span>
            <span className={styles.slotGo} aria-hidden="true">
              {pending === slot.id ? (
                <Spinner size={16} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              )}
            </span>
          </button>
        ))}
      </div>
      {error ? <p className={styles.note}>{error}</p> : null}
    </>
  );
}
