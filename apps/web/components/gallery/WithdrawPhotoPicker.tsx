"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/components/gallery/collective.module.css";
import type { GroupPhoto, GroupSlotSummary } from "@/lib/gallery-group";

// Sans justification, sans preuve d'identité — le code de la sortie suffit
// (brief §5.3). Accessible depuis les deux liens "Demander le retrait" de la
// boutique (critère d'acceptation #8).
//
// Deux étapes et non trois : le code désigne déjà la sortie, donc le jour est
// connu. Le retrait ne porte que sur les photos de cette sortie, jamais sur
// l'historique de l'opérateur.
export function WithdrawPhotoPicker({
  basePath,
  apiBase,
  operatorName,
  dateLabel,
  slots,
}: {
  basePath: string;
  apiBase: string;
  operatorName: string;
  dateLabel: string;
  slots: GroupSlotSummary[];
}) {
  const [step, setStep] = useState<"slots" | "photos">("slots");
  const [photos, setPhotos] = useState<GroupPhoto[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  async function openSlot(id: string): Promise<void> {
    setConfirmedId(null);
    setStep("photos");
    const res = await fetch(`${apiBase}/slots/${id}/photos`);
    if (res.ok) {
      const data = (await res.json()) as { photos: GroupPhoto[] };
      setPhotos(data.photos);
    }
  }

  async function confirmHide(photoId: string): Promise<void> {
    setPending(photoId);
    const res = await fetch(`${apiBase}/photos/${photoId}/hide`, { method: "POST" });
    setPending(null);
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setConfirmedId(photoId);
    }
  }

  if (step === "slots") {
    return (
      <>
        <div className={styles.hi}>
          <h1>Demander le retrait d&rsquo;une photo</h1>
          <p>Choisissez le créneau où se trouve la photo. Elle disparaît de la galerie immédiatement, pour tout le monde.</p>
        </div>
        <div className={styles.slots}>
          {slots.map((slot) => (
            <button key={slot.id} type="button" className={styles.slot} onClick={() => void openSlot(slot.id)}>
              <span className={styles.info}>
                <span className={styles.h}>{slot.label}</span>
                <span className={styles.a}>{slot.activity}</span>
              </span>
              <span className={styles.n}>{slot.photoCount} photos</span>
            </button>
          ))}
        </div>
        <div className={styles.legal}>
          {dateLabel ? <p>{dateLabel.replace(/^./, (c) => c.toUpperCase())}</p> : null}
          <Link href={basePath}>Revenir aux photos</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.hi}>
        <h1>Touchez une photo pour la retirer</h1>
        <p>Le masquage est immédiat et définitif. Aucune justification n&rsquo;est demandée.</p>
      </div>
      <div className={styles.grid}>
        {photos.map((photo) => (
          <div key={photo.id} className={styles.cell}>
            {photo.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.previewUrl} alt="" />
            ) : null}
            <button type="button" className={styles.hideBar} onClick={() => confirmHide(photo.id)} disabled={pending === photo.id}>
              {pending === photo.id ? "Retrait…" : "Retirer cette photo"}
            </button>
          </div>
        ))}
      </div>
      {confirmedId ? <div className={styles.legal}>Photo retirée. {operatorName} en a été informé.</div> : null}
      <div className={styles.legal}>
        <button type="button" onClick={() => setStep("slots")}>
          Changer de créneau
        </button>
      </div>
    </>
  );
}
