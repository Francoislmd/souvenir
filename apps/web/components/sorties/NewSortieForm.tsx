"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { useToast } from "@/components/operator/ToastProvider";

interface PendingParticipant {
  name: string;
  contact: string;
}

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
  const [seats, setSeats] = useState("8");
  const [guide, setGuide] = useState("Marc");
  const [apName, setApName] = useState("");
  const [apTel, setApTel] = useState("");
  const [participants, setParticipants] = useState<PendingParticipant[]>([]);
  const [mode, setMode] = useState<"INDIVIDUEL" | "GROUPE">("INDIVIDUEL");
  const [saving, setSaving] = useState(false);

  function addP(): void {
    const name = apName.trim();
    if (!name) {
      toast("Il manque le prénom");
      return;
    }
    if (!apTel.trim()) {
      toast("Sans email ni numéro, impossible de lui envoyer ses photos");
      return;
    }
    setParticipants((prev) => [...prev, { name, contact: apTel.trim() }]);
    setApName("");
    setApTel("");
  }

  function removeP(index: number): void {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  }

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
          seats: Number(seats) || 8,
          guide: guide.trim() || null,
          mode,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const { sortieId } = (await res.json()) as { sortieId: string };

      if (mode === "INDIVIDUEL") {
        for (const p of participants) {
          await fetch(`/api/sorties/${sortieId}/participants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: p.name, contact: p.contact }),
          });
        }
      }

      toast(
        mode === "GROUPE"
          ? "Sortie créée · galerie de groupe"
          : participants.length
            ? `Sortie créée avec ${participants.length} client${participants.length > 1 ? "s" : ""}`
            : "Sortie créée",
      );
      router.push("/sorties");
      router.refresh();
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
      <div className={styles.two}>
        <div className={styles.field} style={{ margin: 0 }}>
          <label htmlFor="nSeats">Places</label>
          <input className={styles.inp} type="number" id="nSeats" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} />
        </div>
        <div className={styles.field} style={{ margin: 0 }}>
          <label htmlFor="nGuide">Guide</label>
          <input className={styles.inp} id="nGuide" placeholder="Optionnel" value={guide} onChange={(e) => setGuide(e.target.value)} />
        </div>
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

      {mode === "GROUPE" ? (
        <div className={styles.soon} style={{ marginTop: 14 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--aqua)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: 1 }}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-5M12 8v.5" />
          </svg>
          <div>
            <div className={styles.t}>Les photos seront visibles par tout le groupe</div>
            <div className={styles.h}>Prévenez vos clients au briefing. Chacun pourra demander le retrait d&rsquo;une photo sans avoir à se justifier.</div>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.lbl}>
            Participants <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 600 }}>· optionnel</span>
          </div>
          <p className={styles.lead} style={{ margin: "-6px 0 12px", fontSize: ".88rem" }}>
            Notez ceux qui ont déjà réservé. Les autres, vous les ajouterez sur place.
          </p>

          <div className={styles.addp}>
            <input
              className={styles.inp}
              placeholder="Prénom"
              value={apName}
              onChange={(e) => setApName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addP()}
            />
            <input
              className={styles.inp}
              placeholder="Email ou WhatsApp"
              value={apTel}
              onChange={(e) => setApTel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addP()}
            />
            <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.sm}`} onClick={addP}>
              Ajouter
            </button>
          </div>

          <div className={styles.rows} style={{ marginTop: 10 }}>
            {participants.map((p, i) => (
              <div key={i} className={styles.row} style={{ cursor: "default" }}>
                <span className={styles.info}>
                  <span className={styles.ti}>{p.name}</span>
                  <span className={styles.sb}>{p.contact}</span>
                </span>
                <button type="button" className={styles.rmv} aria-label="Retirer" onClick={() => removeP(i)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.act}>
        <button type="button" className={`${styles.btn} ${styles.full}`} onClick={createSortie} disabled={saving}>
          {saving ? "Création…" : "Créer la sortie"}
        </button>
      </div>
    </>
  );
}
