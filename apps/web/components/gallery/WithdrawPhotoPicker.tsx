"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/app/g/s/[shareToken]/collective.module.css";
import type { GroupDaySummary, GroupPhoto, GroupSlotSummary } from "@/lib/gallery-group";

type Step = "days" | "slots" | "photos";

// Sans justification, sans preuve d'identité — le shareToken de l'opérateur
// suffit (brief §5.3). Accessible depuis les deux liens "Demander le
// retrait" de /g/s/[shareToken] (critère d'acceptation #8).
export function WithdrawPhotoPicker({ shareToken, days }: { shareToken: string; days: GroupDaySummary[] }) {
  const [step, setStep] = useState<Step>("days");
  const [activeDay, setActiveDay] = useState<GroupDaySummary | null>(null);
  const [slots, setSlots] = useState<GroupSlotSummary[]>([]);
  const [photos, setPhotos] = useState<GroupPhoto[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  async function openDay(day: GroupDaySummary): Promise<void> {
    setActiveDay(day);
    setStep("slots");
    const res = await fetch(`/api/g/s/${shareToken}/days/${encodeURIComponent(day.dateKey)}/slots`);
    if (res.ok) {
      const data = (await res.json()) as { dateLabel: string; slots: GroupSlotSummary[] };
      setSlots(data.slots);
    }
  }

  async function openSlot(id: string): Promise<void> {
    setConfirmedId(null);
    setStep("photos");
    const res = await fetch(`/api/g/s/${shareToken}/slots/${id}/photos`);
    if (res.ok) {
      const data = (await res.json()) as { photos: GroupPhoto[] };
      setPhotos(data.photos);
    }
  }

  async function confirmHide(photoId: string): Promise<void> {
    setPending(photoId);
    const res = await fetch(`/api/g/s/${shareToken}/photos/${photoId}/hide`, { method: "POST" });
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
          <p>Choisissez le jour, puis le créneau où se trouve la photo — elle sera masquée immédiatement, pour tout le monde.</p>
        </div>
        <div className={styles.slots}>
          {days.map((day) => (
            <button key={day.dateKey} type="button" className={styles.slot} onClick={() => void openDay(day)}>
              <span className={styles.cov}>
                {day.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={day.coverUrl} alt="" />
                ) : null}
              </span>
              <span className={styles.info}>
                <span className={styles.h}>{day.dateLabel}</span>
              </span>
              <span className={styles.n}>
                {day.slotCount} créneau{day.slotCount > 1 ? "x" : ""}
              </span>
            </button>
          ))}
        </div>
        <div className={styles.legal}>
          <Link href={`/g/s/${shareToken}`}>← Retour à la galerie</Link>
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
        <div className={styles.slots}>
          {slots.map((slot) => (
            <button key={slot.id} type="button" className={styles.slot} onClick={() => void openSlot(slot.id)}>
              <span className={styles.cov}>
                {slot.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slot.coverUrl} alt="" />
                ) : null}
              </span>
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
        <p>Le masquage est immédiat et définitif. Aucune justification n&rsquo;est demandée.</p>
      </div>
      <div className={styles.grid}>
        {photos.map((photo) => (
          <div key={photo.id} className={styles.cell}>
            {photo.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.previewUrl} alt="" onClick={() => confirmHide(photo.id)} style={{ cursor: "pointer" }} />
            ) : null}
            {pending === photo.id ? (
              <span className={styles.wm}>
                <span>…</span>
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {confirmedId ? <div className={styles.legal}>Photo retirée — l&rsquo;opérateur a été prévenu.</div> : null}
      <div className={styles.legal}>
        <button type="button" onClick={() => setStep("slots")}>
          Changer de créneau
        </button>
      </div>
    </>
  );
}
