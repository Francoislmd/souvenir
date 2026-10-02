"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/components/gallery/collective.module.css";
import { Spinner, TileSpinner } from "@/components/ui/Spinner";
import { VideoBadge } from "@/components/ui/VideoBadge";

export interface WithdrawablePhoto {
  id: string;
  previewUrl: string | null;
  isVideo?: boolean;
  durationSec?: number | null;
}

/**
 * Retirer une photo depuis sa galerie privée. Sans justification, sans
 * confirmation de plus : le geste est le bouton.
 */
export function PrivateWithdraw({ token, operatorName, photos: initial }: { token: string; operatorName: string; photos: WithdrawablePhoto[] }) {
  const [photos, setPhotos] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function hide(photoId: string): Promise<void> {
    if (pending) return;
    setPending(photoId);
    setMessage(null);
    try {
      const res = await fetch(`/api/g/${token}/hide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setMessage(`Photo retirée. ${operatorName} en a été informé.`);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(res.status === 429 && data.error ? data.error : "Le retrait n'a pas abouti. Réessayez.");
      }
    } catch {
      setMessage("Le réseau a coupé. Réessayez.");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <div className={styles.hi}>
        <h1>Retirer une photo</h1>
        <p>Touchez celle que vous ne voulez pas voir en ligne. Elle disparaît immédiatement, pour tous les participants. Aucune justification ne vous est demandée.</p>
      </div>
      {message ? <div className={styles.legal}>{message}</div> : null}
      <div className={styles.grid}>
        {photos.map((photo) => (
          <div key={photo.id} className={styles.cell}>
            {photo.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.previewUrl} alt="" />
            ) : (
              <TileSpinner />
            )}
            {photo.isVideo ? <VideoBadge durationSec={photo.durationSec} /> : null}
            <button type="button" className={styles.hideBar} onClick={() => void hide(photo.id)} disabled={!!pending}>
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
      <div className={styles.legal}>
        <Link href={`/g/${token}`}>Revenir à vos photos</Link>
      </div>
    </>
  );
}
