"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { useToast } from "@/components/operator/ToastProvider";

function defaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function NewSortieForm({ activities: ACTIVITIES }: { activities: string[] }) {
  const router = useRouter();
  const toast = useToast();

  const [activityIndex, setActivityIndex] = useState(0);
  const [date, setDate] = useState(defaultDate());
  const [time, setTime] = useState("10:00");
  const [guide, setGuide] = useState("Marc");
  const [mode, setMode] = useState<"INDIVIDUEL" | "GROUPE">("INDIVIDUEL");
  const [saving, setSaving] = useState(false);

  async function createSortie(): Promise<void> {
    if (saving) return;
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
          activity: ACTIVITIES[activityIndex],
          startsAt: new Date(`${date}T${time || "10:00"}:00`).toISOString(),
          guide: guide.trim() || null,
          mode,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const { sortieId } = (await res.json()) as { sortieId: string };

      toast(mode === "GROUPE" ? "Sortie créée · galerie de groupe" : "Sortie créée");
      // Individuel : étape 2, on note les participants sur la fiche sortie.
      // Groupe : rien à saisir, on passe directement au dépôt des photos.
      router.push(mode === "GROUPE" ? `/sorties/${sortieId}/photos` : `/sorties/${sortieId}`);
    } catch {
      toast("Le réseau a coupé — réessaie dans une minute.");
      setSaving(false);
    }
  }

  return (
    <>
      <div className={styles.lbl} style={{ marginTop: 0 }}>
        Activité
      </div>
      <div className={styles.acts}>
        {ACTIVITIES.map((a, i) => (
          <button key={a} type="button" className={`${styles.ac} ${i === activityIndex ? styles.on : ""}`} onClick={() => setActivityIndex(i)}>
            {a}
          </button>
        ))}
      </div>

      <div className={styles.lbl}>Quand</div>
      <div className={styles.two}>
        <div className={styles.field} style={{ margin: 0 }}>
          <label htmlFor="nDate">Date</label>
          <input className={styles.inp} type="date" id="nDate" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className={styles.field} style={{ margin: 0 }}>
          <label htmlFor="nTime">Heure</label>
          <input className={styles.inp} type="time" id="nTime" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div className={styles.lbl}>Qui encadre</div>
      <div className={styles.field} style={{ margin: 0 }}>
        <label htmlFor="nGuide">Guide</label>
        <input className={styles.inp} id="nGuide" placeholder="Optionnel" value={guide} onChange={(e) => setGuide(e.target.value)} />
      </div>

      <div className={styles.lbl}>Comment envoyer les photos ?</div>
      <div className={styles.modes}>
        <button type="button" className={`${styles.mode} ${mode === "INDIVIDUEL" ? styles.on : ""}`} onClick={() => setMode("INDIVIDUEL")}>
          <div className={styles.mt}>Je connais mes clients</div>
          <div className={styles.mh}>Vous les notez, chacun reçoit sa galerie personnelle.</div>
        </button>
        <button type="button" className={`${styles.mode} ${mode === "GROUPE" ? styles.on : ""}`} onClick={() => setMode("GROUPE")}>
          <div className={styles.mt}>Sortie en groupe</div>
          <div className={styles.mh}>Un lien unique, chacun retrouve ses photos par créneau.</div>
        </button>
      </div>

      <div className={styles.act}>
        <button type="button" className={`${styles.btn} ${styles.full}`} onClick={createSortie} disabled={saving}>
          {saving ? "Création…" : "Créer la sortie"}
        </button>
      </div>
    </>
  );
}
