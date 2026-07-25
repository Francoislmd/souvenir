"use client";

import { useState } from "react";
import QRCode from "qrcode";
import styles from "@/app/(operator)/operator.module.css";
import { useToast } from "@/components/operator/ToastProvider";

/**
 * Les deux actions de partage de la galerie de groupe (carte sortie +
 * écran "Galerie publiée") — un seul endroit pour cette logique, montée
 * deux fois dans l'app.
 */
export function GroupShareActions({ shareUrl }: { shareUrl: string }) {
  const toast = useToast();
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  async function shareToGroup(): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Vos photos", url: shareUrl });
      } catch {
        // Partage annulé par l'opérateur — rien à faire.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // repli silencieux — le lien reste visible et copiable à la main
    }
    toast("Le partage n'est pas disponible ici — lien copié, collez-le dans votre message");
  }

  async function openQr(): Promise<void> {
    setQrOpen(true);
    if (qrDataUrl) return;
    const dataUrl = await QRCode.toDataURL(shareUrl, { width: 480, margin: 2, color: { dark: "#161320", light: "#FFFFFF" } });
    setQrDataUrl(dataUrl);
  }

  return (
    <>
      <div className={styles.sharerow}>
        <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.sm}`} onClick={() => void shareToGroup()}>
          Envoyer au groupe
        </button>
        <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.sm}`} onClick={() => void openQr()}>
          QR code
        </button>
      </div>

      {qrOpen ? (
        <div className={styles.qrOverlay} onClick={() => setQrOpen(false)}>
          <div className={styles.qrCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.qrImg}>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR code de la galerie" />
              ) : null}
            </div>
            <div className={styles.lh} style={{ textAlign: "center", wordBreak: "break-all" }}>
              {shareUrl.replace(/^https?:\/\//, "")}
            </div>
            <div className={styles.sharerow} style={{ justifyContent: "center" }}>
              {qrDataUrl ? (
                <a href={qrDataUrl} download="qr-code-galerie.png" className={`${styles.btn} ${styles.sm}`} style={{ textDecoration: "none" }}>
                  Télécharger
                </a>
              ) : null}
              <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.sm}`} onClick={() => setQrOpen(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
