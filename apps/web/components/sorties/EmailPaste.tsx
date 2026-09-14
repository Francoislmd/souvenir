"use client";

import { useRef, useState } from "react";
import styles from "@/app/(operator)/operator.module.css";
import { parseEmails, pasteSummary } from "@/lib/emails";

/**
 * Coller des adresses, jamais les taper.
 *
 * En fin de sortie l'opérateur est sur un téléphone, souvent debout : saisir
 * douze adresses à la main était le geste le plus cher de l'écran, et c'est
 * celui qu'on supprime. Le bouton lit le presse-papiers et garde ce qui est
 * une adresse, quel que soit ce qui a été copié — colonne de tableur, liste
 * avec prénoms, fil de réservations.
 *
 * Le presse-papiers n'est pas toujours lisible (permission refusée, navigateur
 * qui l'ignore, page non sécurisée) : dans ce cas seulement, un champ prend le
 * relais. Il n'apparaît jamais avant, pour ne pas rendre la saisie à la main
 * plus visible que le collage.
 */

function ClipboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="8.4" y="2.6" width="7.2" height="4.2" rx="1.6" />
      <path d="M15.6 4.7h1.9a2 2 0 0 1 2 2v12.7a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V6.7a2 2 0 0 1 2-2h1.9" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/** Les adresses retenues, chacune retirable. Rien du tout s'il n'y en a pas. */
export function EmailPills({ emails, onRemove, shown = 5 }: { emails: string[]; onRemove: (email: string) => void; shown?: number }) {
  if (emails.length === 0) return null;
  const head = emails.slice(0, shown);
  const rest = emails.length - head.length;
  return (
    <div className={styles.sdPaste}>
      {head.map((email) => (
        <span key={email} className={styles.sdPill}>
          {email}
          <button type="button" className={styles.sdPillX} aria-label={`Retirer ${email}`} onClick={() => onRemove(email)}>
            <CrossIcon />
          </button>
        </span>
      ))}
      {rest > 0 ? <span className={styles.sdPillMore}>et {rest} autre{rest > 1 ? "s" : ""}</span> : null}
    </div>
  );
}

export function PasteEmailsButton({
  label,
  known,
  onEmails,
  onMessage,
}: {
  label: string;
  /** Les adresses déjà retenues : les recoller n'en ajoute aucune. */
  known: string[];
  onEmails: (emails: string[]) => void;
  /** Ce que le collage a écarté, à dire une fois, là où la barre parle. */
  onMessage: (message: string) => void;
}) {
  const [manual, setManual] = useState(false);
  const [text, setText] = useState("");
  const field = useRef<HTMLTextAreaElement | null>(null);

  function keep(raw: string): boolean {
    const parsed = parseEmails(raw, known);
    if (parsed.emails.length === 0) {
      onMessage("Aucune adresse dans ce qui a été collé.");
      return false;
    }
    onEmails(parsed.emails);
    onMessage(pasteSummary(parsed));
    return true;
  }

  async function paste(): Promise<void> {
    try {
      const raw = await navigator.clipboard.readText();
      if (!raw.trim()) {
        onMessage("Le presse-papiers est vide.");
        return;
      }
      keep(raw);
    } catch {
      // Permission refusée ou API absente : le champ prend le relais, et il
      // reste ouvert tant que l'opérateur ne l'a pas vidé.
      setManual(true);
      window.setTimeout(() => field.current?.focus(), 0);
    }
  }

  return (
    <>
      <button type="button" className={styles.sdChip} onClick={() => void paste()}>
        <ClipboardIcon />
        <span className={styles.sdChipLabel}>{label}</span>
      </button>

      {manual ? (
        <span className={styles.sdManual}>
          <textarea
            ref={field}
            className={`${styles.sdInp} ${styles.sdManualTa}`}
            rows={3}
            spellCheck={false}
            placeholder="Collez ici les adresses de vos clients"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <span className={styles.sdManualFoot}>
            <button
              type="button"
              className={`${styles.sBtn} ${styles.sBtnSm} ${styles.sBtnInk}`}
              onClick={() => {
                if (keep(text)) {
                  setText("");
                  setManual(false);
                }
              }}
            >
              Ajouter
            </button>
            <button type="button" className={`${styles.sdChip} ${styles.sdChipGhost}`} onClick={() => setManual(false)}>
              Annuler
            </button>
          </span>
        </span>
      ) : null}
    </>
  );
}
