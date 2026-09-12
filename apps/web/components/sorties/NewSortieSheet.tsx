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

  return (
    <div className={styles.shOverlay} onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className={styles.shPanel}
        role="dialog"
        aria-modal="true"
        aria-label="Nouvelle sortie"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.shGrip} aria-hidden="true" />
        <h2 className={styles.shTitle}>Nouvelle sortie</h2>

        <p className={styles.shLbl}>Activité</p>
        <div className={styles.shChips}>
          {activities.map((a) => (
            <button
              key={a}
              type="button"
              className={`${styles.shChip} ${a === activity ? styles.shChipOn : ""}`}
              aria-pressed={a === activity}
              onClick={() => setActivity(a)}
            >
              {a}
            </button>
          ))}
        </div>

        <p className={styles.shLbl}>Quand</p>
        <div className={styles.shSeg}>
          {([
            ["today", "Aujourd'hui"],
            ["tomorrow", "Demain"],
            ["other", "Autre date"],
          ] as [DayChoice, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`${styles.shSegBtn} ${day === key ? styles.shSegOn : ""}`}
              aria-pressed={day === key}
              onClick={() => setDay(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {day === "other" ? (
          <div className={styles.shRow}>
            <label htmlFor="shDate">Date</label>
            <input id="shDate" type="date" className={styles.shInp} value={otherDate} onChange={(e) => setOtherDate(e.target.value)} />
          </div>
        ) : null}

        <div className={styles.shRow}>
          <label htmlFor="shTime">Heure de départ</label>
          <input id="shTime" type="time" className={styles.shInp} value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        {mode === null ? (
          <>
            <p className={styles.shLbl}>Comment vos clients reçoivent leurs photos</p>
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
          </>
        ) : null}

        <div className={styles.shActions}>
          <button type="button" className={`${styles.sBtn} ${styles.sBtnPri} ${styles.shFull}`} onClick={() => void create()} disabled={saving}>
            {saving ? (
              <>
                <Spinner size={16} tone="current" />
                Création…
              </>
            ) : (
              "Créer la sortie"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
