"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { AppHeader } from "@/components/operator/AppHeader";
import { useToast } from "@/components/operator/ToastProvider";
import { Spinner } from "@/components/ui/Spinner";

function DocIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.25 3.75h8l3.5 3.5v13H6.25z" />
      <path d="M12 10.5v6M9 13.5h6" />
    </svg>
  );
}

/**
 * L'en-tête de Factures et son bouton « Générer une facture ». Comme pour
 * « Nouvelle sortie », le bouton d'en-tête sert sur grand écran et un bouton
 * pleine largeur le relaie sur téléphone. Tant que la facturation n'est pas
 * ouverte, il n'y a pas de bouton du tout (jamais de bouton désactivé).
 */
export function FacturesHeader({
  ready,
  defaultFrom,
  defaultTo,
  maxDay,
}: {
  ready: boolean;
  defaultFrom: string;
  defaultTo: string;
  maxDay: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppHeader
        title="Factures"
        action={
          ready ? (
            <button type="button" className={`${styles.sBtn} ${styles.sBtnPri}`} onClick={() => setOpen(true)}>
              <DocIcon />
              Générer une facture
            </button>
          ) : undefined
        }
      />

      {ready ? (
        <div className={styles.sCtaWrap}>
          <button type="button" className={`${styles.sBtn} ${styles.sBtnPri} ${styles.sCtaMobile}`} onClick={() => setOpen(true)}>
            <DocIcon />
            Générer une facture
          </button>
        </div>
      ) : null}

      {open ? <GenerateSheet defaultFrom={defaultFrom} defaultTo={defaultTo} maxDay={maxDay} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function GenerateSheet({
  defaultFrom,
  defaultTo,
  maxDay,
  onClose,
}: {
  defaultFrom: string;
  defaultTo: string;
  maxDay: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  async function submit(): Promise<void> {
    if (!from || !to) {
      setMessage("Choisissez les deux dates.");
      return;
    }
    if (from > to) {
      setMessage("La date de début doit précéder la date de fin.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/factures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
      });
      const data = (await res.json().catch(() => ({}))) as { created?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "La facture n’a pas pu être créée.");
      if (!data.created) {
        setMessage("Aucune vente à facturer sur ces dates : elles sont déjà toutes sur une facture.");
        setBusy(false);
        return;
      }
      toast(data.created > 1 ? `${data.created} factures créées, une par mois` : "Facture créée");
      router.refresh();
      onClose();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "La facture n’a pas pu être créée.");
      setBusy(false);
    }
  }

  return (
    <div className={styles.shOverlay} onClick={busy ? undefined : onClose} role="presentation">
      <div
        ref={panelRef}
        className={`${styles.shPanel} ${styles.nsPanel}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fcTitle"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.shGrip} aria-hidden="true" />
        <header className={styles.nsHead}>
          <h2 id="fcTitle" className={styles.nsTitle}>
            Générer une facture
          </h2>
          <button type="button" className={styles.nsClose} onClick={onClose} aria-label="Fermer" disabled={busy}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className={styles.nsBody}>
            <div className={styles.nsRow}>
              <label htmlFor="fcFrom" className={styles.nsLbl}>
                Du
              </label>
              <input
                id="fcFrom"
                type="date"
                className={styles.nsInp}
                value={from}
                max={maxDay}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setMessage(null);
                }}
              />
            </div>
            <div className={styles.nsRow}>
              <label htmlFor="fcTo" className={styles.nsLbl}>
                Au
              </label>
              <input
                id="fcTo"
                type="date"
                className={styles.nsInp}
                value={to}
                min={from || undefined}
                max={maxDay}
                onChange={(e) => {
                  setTo(e.target.value);
                  setMessage(null);
                }}
              />
            </div>
            <p className={styles.fcHint}>
              Seules les ventes pas encore facturées y figurent. Une période sur plusieurs mois donne une facture par mois.
            </p>
            {message ? (
              <p className={styles.fcMsg} role="status">
                {message}
              </p>
            ) : null}
          </div>

          <footer className={styles.nsFoot}>
            <button type="button" className={styles.nsCancel} onClick={onClose} disabled={busy}>
              Annuler
            </button>
            <button type="submit" className={styles.nsGo} disabled={busy} aria-busy={busy || undefined}>
              <span>Générer</span>
              {busy ? (
                <span className={styles.nsBusy}>
                  <Spinner size={14} tone="light" label="Création de la facture" />
                </span>
              ) : null}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
