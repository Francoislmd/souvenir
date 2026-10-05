"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/operator/ToastProvider";

export type SortieMode = "INDIVIDUEL" | "GROUPE";

type DayChoice = "today" | "tomorrow" | "other";

/** `toISOString()` bascule d'un jour selon le fuseau — on formate à la main
 *  sur l'heure locale, qui est celle que l'opérateur a sous les yeux. */
function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateFor(choice: DayChoice, other: string): string {
  const d = new Date();
  if (choice === "tomorrow") d.setDate(d.getDate() + 1);
  return choice === "other" ? other : localDate(d);
}

/**
 * Deux questions, pas quatre : l'activité et le moment. Le lieu, le guide et
 * le nombre de places se renseignent sur la fiche sortie, quand ils servent —
 * les demander à la création faisait payer d'avance une saisie facultative.
 *
 * Le mode de réception n'est demandé qu'à la toute première sortie
 * (`mode === null`) : c'est une habitude de métier, pas une décision à
 * reprendre chaque fois.
 */
export function NewSortieSheet({
  activities,
  mode,
  onClose,
}: {
  activities: string[];
  mode: SortieMode | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const panelRef = useRef<HTMLDivElement>(null);

  const [activity, setActivity] = useState(activities[0] ?? "");
  const [day, setDay] = useState<DayChoice>("today");
  const [otherDate, setOtherDate] = useState(localDate(new Date()));
  const [time, setTime] = useState("09:00");
  const [chosenMode, setChosenMode] = useState<SortieMode>(mode ?? "GROUPE");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  async function create(): Promise<void> {
    if (saving) return;
    const date = dateFor(day, otherDate);
    if (!date) {
      toast("Il manque la date");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/sorties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity,
          startsAt: new Date(`${date}T${time || "09:00"}:00`).toISOString(),
          mode: chosenMode,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const { sortieId } = (await res.json()) as { sortieId: string };
      onClose();
      router.push(`/sorties/${sortieId}`);
      router.refresh();
    } catch {
      toast("Le réseau a coupé — réessayez dans une minute.");
      setSaving(false);
    }
  }

  const segmented = activities.length <= 3;

  return (
    <div className={styles.shOverlay} onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className={`${styles.shPanel} ${styles.nsPanel}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nsTitle"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.shGrip} aria-hidden="true" />
        <header className={styles.nsHead}>
          <h2 id="nsTitle" className={styles.nsTitle}>
            Nouvelle sortie
          </h2>
          <button type="button" className={styles.nsClose} onClick={onClose} aria-label="Fermer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
        >
          <div className={styles.nsBody}>
            <div className={styles.nsRow}>
              <span className={styles.nsLbl} id="nsActLbl">
                Activité
              </span>
              {segmented ? (
                <div className={styles.nsSeg} role="radiogroup" aria-labelledby="nsActLbl">
                  {activities.map((a) => (
                    <button key={a} type="button" role="radio" aria-checked={a === activity} onClick={() => setActivity(a)}>
                      {a}
                    </button>
                  ))}
                </div>
              ) : (
                <select aria-labelledby="nsActLbl" className={styles.nsInp} value={activity} onChange={(e) => setActivity(e.target.value)}>
                  {activities.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className={styles.nsRow}>
              <span className={styles.nsLbl} id="nsDayLbl">
                Date
              </span>
              <div className={styles.nsCtl}>
                <div className={styles.nsSeg} role="radiogroup" aria-labelledby="nsDayLbl">
                  {([
                    ["today", "Aujourd'hui"],
                    ["tomorrow", "Demain"],
                    ["other", "Autre"],
                  ] as [DayChoice, string][]).map(([key, label]) => (
                    <button key={key} type="button" role="radio" aria-checked={day === key} onClick={() => setDay(key)}>
                      {label}
                    </button>
                  ))}
                </div>
                {day === "other" ? (
                  <input id="shDate" type="date" aria-label="Jour" className={styles.nsInp} value={otherDate} onChange={(e) => setOtherDate(e.target.value)} />
                ) : null}
              </div>
            </div>

            <div className={styles.nsRow}>
              <label htmlFor="shTime" className={styles.nsLbl}>
                Départ
              </label>
              <input id="shTime" type="time" className={`${styles.nsInp} ${styles.nsTime}`} value={time} onChange={(e) => setTime(e.target.value)} />
            </div>

            {mode === null ? (
              <fieldset className={styles.nsMode}>
                <legend className={styles.nsLbl}>Comment vos clients reçoivent leurs photos</legend>
                <p className={styles.shHint}>On ne vous le redemandera plus : vos prochaines sorties reprendront ce choix.</p>
                <button
                  type="button"
                  className={`${styles.shPick} ${chosenMode === "GROUPE" ? styles.shPickOn : ""}`}
                  aria-pressed={chosenMode === "GROUPE"}
                  onClick={() => setChosenMode("GROUPE")}
                >
                  <b>Un lien pour tout le monde</b>
                  <span>Vous affichez le lien au retour. Chacun retrouve son créneau. Rien à saisir.</span>
                </button>
                <button
                  type="button"
                  className={`${styles.shPick} ${chosenMode === "INDIVIDUEL" ? styles.shPickOn : ""}`}
                  aria-pressed={chosenMode === "INDIVIDUEL"}
                  onClick={() => setChosenMode("INDIVIDUEL")}
                >
                  <b>Chacun sa galerie</b>
                  <span>Vous notez le prénom et le contact de chaque client. Plus long, mais nominatif.</span>
                </button>
              </fieldset>
            ) : null}
          </div>

          <footer className={styles.nsFoot}>
            <button type="button" className={styles.nsCancel} onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className={styles.nsGo} disabled={saving || !activity} aria-busy={saving || undefined}>
              <span>Créer</span>
              {saving ? (
                <span className={styles.nsBusy}>
                  <Spinner size={14} tone="light" label="Création en cours" />
                </span>
              ) : null}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
