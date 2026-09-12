"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/components/gallery/collective.module.css";
import { LoadingBlock, Spinner, TileSpinner } from "@/components/ui/Spinner";
import type { GroupDaySummary, GroupPhoto, GroupSlotSummary } from "@/lib/gallery-group";

type Step = "days" | "slots" | "photos";

// Sans justification, sans preuve d'identité (brief §5.3). La boutique étant
// ouverte à qui connaît le nom du prestataire, ce lien est le seul recours de
// quelqu'un qui ne veut pas y figurer : il doit rester atteignable depuis
// chaque écran, et ne jamais rien demander.
export function WithdrawPhotoPicker({
  basePath,
  apiBase,
  operatorName,
  days,
}: {
  basePath: string;
  apiBase: string;
  operatorName: string;
  days: GroupDaySummary[];
}) {
  const [step, setStep] = useState<Step>("days");
  const [activeDay, setActiveDay] = useState<GroupDaySummary | null>(null);
  const [slots, setSlots] = useState<GroupSlotSummary[]>([]);
  const [photos, setPhotos] = useState<GroupPhoto[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  // L'écran change avant que la liste n'arrive : sans ça, on passe une
  // seconde devant une page vide qui a l'air de dire « il n'y a rien ».
  const [busy, setBusy] = useState(false);

  async function openDay(day: GroupDaySummary): Promise<void> {
    setActiveDay(day);
    setSlots([]);
    setStep("slots");
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/days/${encodeURIComponent(day.dateKey)}/slots`);
      if (res.ok) {
        const data = (await res.json()) as { dateLabel: string; slots: GroupSlotSummary[] };
        setSlots(data.slots);
      }
    } finally {
      setBusy(false);
    }
  }

  async function openSlot(id: string): Promise<void> {
    setConfirmedId(null);
    setPhotos([]);
    setStep("photos");
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/slots/${id}/photos`);
      if (res.ok) {
        const data = (await res.json()) as { photos: GroupPhoto[] };
        setPhotos(data.photos);
      }
    } finally {
      setBusy(false);
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

  if (step === "days") {
    return (
      <>
        <div className={styles.hi}>
          <h1>Demander le retrait d&rsquo;une photo</h1>
          <p>Choisissez le jour, puis le créneau où se trouve la photo. Elle disparaît de la galerie immédiatement, pour tout le monde.</p>
        </div>
        <div className={styles.slots}>
          {days.map((day) => (
            <button key={day.dateKey} type="button" className={styles.slot} onClick={() => void openDay(day)}>
              <span className={styles.info}>
                <span className={styles.h}>{day.dateLabel}</span>
              </span>
              <span className={styles.n}>
                {day.sessionCount} créneau{day.sessionCount > 1 ? "x" : ""}
              </span>
            </button>
          ))}
        </div>
        <div className={styles.legal}>
          <Link href={basePath}>Revenir aux photos</Link>
        </div>
      </>
    );
  }

  if (step === "slots") {
    return (
      <>
        <div className={styles.hi}>
          <h1>Choisissez le créneau</h1>
          <p>{activeDay?.dateLabel}</p>
        </div>
        {busy && slots.length === 0 ? <LoadingBlock label="Chargement des créneaux…" /> : null}
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
          <button type="button" onClick={() => setStep("days")}>
            ← Changer de jour
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.hi}>
        <h1>Touchez une photo pour la retirer</h1>
        <p>Le retrait est définitif. Aucune justification ne vous est demandée.</p>
      </div>
      {busy && photos.length === 0 ? <LoadingBlock label="Chargement des photos…" /> : null}
      <div className={styles.grid}>
        {photos.map((photo) => (
          <div key={photo.id} className={styles.cell}>
            {photo.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.previewUrl} alt="" />
            ) : (
              <TileSpinner />
            )}
            <button type="button" className={styles.hideBar} onClick={() => confirmHide(photo.id)} disabled={pending === photo.id}>
              {pending === photo.id ? (
                <>
                  <Spinner size={15} tone="current" />
                  Retrait…
                </>
              ) : (
                "Retirer cette photo"
              )}
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
