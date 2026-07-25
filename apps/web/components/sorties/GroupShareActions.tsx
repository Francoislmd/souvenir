"use client";

import { useMemo, useState } from "react";
import QRCode from "qrcode";
import styles from "@/app/(operator)/operator.module.css";
import { useToast } from "@/components/operator/ToastProvider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(text: string): { valid: string[]; invalidCount: number } {
  const tokens = text
    .split(/[,;\n\r\t]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const valid = Array.from(new Set(tokens.filter((t) => EMAIL_RE.test(t))));
  const invalidCount = tokens.length - tokens.filter((t) => EMAIL_RE.test(t)).length;
  return { valid, invalidCount };
}

/**
 * Les deux actions de partage de la galerie de groupe (carte sortie +
 * écran "Galerie publiée") — un seul endroit pour cette logique, montée
 * deux fois dans l'app.
 */
export function GroupShareActions({ sortieId, shareUrl }: { sortieId: string; shareUrl: string }) {
  const toast = useToast();
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [emailsText, setEmailsText] = useState("");
  const [sending, setSending] = useState(false);

  const { valid: validEmails, invalidCount } = useMemo(() => parseEmails(emailsText), [emailsText]);

  async function openQr(): Promise<void> {
    setQrOpen(true);
    if (qrDataUrl) return;
    const dataUrl = await QRCode.toDataURL(shareUrl, { width: 480, margin: 2, color: { dark: "#161320", light: "#FFFFFF" } });
    setQrDataUrl(dataUrl);
  }

  async function sendInvites(): Promise<void> {
    if (validEmails.length === 0 || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/sorties/${sortieId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: validEmails }),
      });
      if (!res.ok) {
        toast("L'envoi a échoué — réessayez.");
        return;
      }
      const data = (await res.json()) as { sent: number; total: number };
      toast(`Envoyé à ${data.sent} adresse${data.sent > 1 ? "s" : ""}`);
      setEmailsText("");
      setInviteOpen(false);
    } catch {
      toast("Le réseau a coupé — réessayez.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className={styles.sharerow}>
        <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.sm}`} onClick={() => setInviteOpen(true)}>
          Envoyer au groupe
        </button>
        <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.sm}`} onClick={() => void openQr()}>
          QR code
        </button>
      </div>

      {inviteOpen ? (
        <div className={styles.qrOverlay} onClick={() => setInviteOpen(false)}>
          <div className={styles.qrCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.lt}>Envoyer le lien par email</div>
            <div className={styles.lh}>Collez une liste d&rsquo;adresses — séparées par une virgule ou un retour à la ligne.</div>
            <textarea
              className={styles.inp}
              rows={5}
              style={{ resize: "vertical", fontFamily: "inherit" }}
              placeholder={"julie@email.com\nthomas@email.com"}
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
            />
            <div className={styles.lh}>
              {validEmails.length} adresse{validEmails.length > 1 ? "s" : ""} valide{validEmails.length > 1 ? "s" : ""}
              {invalidCount > 0 ? ` · ${invalidCount} ignorée${invalidCount > 1 ? "s" : ""}` : ""}
            </div>
            <div className={styles.sharerow} style={{ justifyContent: "center" }}>
              <button type="button" className={`${styles.btn} ${styles.sm}`} onClick={() => void sendInvites()} disabled={validEmails.length === 0 || sending}>
                {sending ? "Envoi…" : "Envoyer"}
              </button>
              <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.sm}`} onClick={() => setInviteOpen(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
