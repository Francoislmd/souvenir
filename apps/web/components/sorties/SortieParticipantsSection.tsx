"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { useToast } from "@/components/operator/ToastProvider";
import { ChannelIcon } from "@/components/sorties/ChannelIcon";
import { deriveChannel } from "@/lib/channel";

export interface ParticipantRow {
  id: string;
  name: string;
  contact: string;
  sentAt: string | null;
  token: string;
}

const AV_VARIANTS = ["", "b", "c"];

export function SortieParticipantsSection({
  sortieId,
  participants,
  editable,
}: {
  sortieId: string;
  participants: ParticipantRow[];
  editable: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);

  async function addToSortie(): Promise<void> {
    if (saving) return;
    if (!name.trim()) {
      toast("Il manque le prénom");
      return;
    }
    if (!contact.trim()) {
      toast("Sans email ni numéro, impossible de lui envoyer ses photos");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/sorties/${sortieId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), contact: contact.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      toast(`${name.trim()} est dans la liste`);
      setName("");
      setContact("");
      router.refresh();
    }
  }

  if (!editable) {
    if (participants.length === 0) {
      return (
        <div className={styles.rows}>
          <div className={styles.row} style={{ cursor: "default", color: "var(--ink-4)", fontSize: ".88rem" }}>
            Personne pour l&rsquo;instant. Vous les noterez avant le départ.
          </div>
        </div>
      );
    }
    return (
      <div className={styles.rows}>
        {participants.map((p) => (
          <div key={p.id} className={styles.row} style={{ cursor: "default" }}>
            <span className={styles.info}>
              <span className={styles.ti}>{p.name}</span>
              <span className={styles.sb}>
                <ChannelIcon isMail={deriveChannel(p.contact) === "EMAIL"} />
                {p.contact}
              </span>
            </span>
            <span className={`${styles.pill} ${styles.wait}`}>Inscrit</span>
          </div>
        ))}
        <div className={styles.row} style={{ cursor: "default", color: "var(--ink-4)", fontSize: ".86rem" }}>
          Vous compléterez la liste avant le départ.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.addp}>
        <input className={styles.inp} placeholder="Prénom" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addToSortie()} />
        <input className={styles.inp} placeholder="Email ou WhatsApp" value={contact} onChange={(e) => setContact(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addToSortie()} />
        <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.sm}`} onClick={addToSortie} disabled={saving}>
          Ajouter
        </button>
      </div>

      <div className={styles.rows} style={{ marginTop: 10 }}>
        {participants.map((p, i) => {
          const variant = AV_VARIANTS[i % 3];
          const content = (
            <>
              <span className={`${styles.av} ${variant ? styles[variant] : ""}`}>{p.name.slice(0, 2).toUpperCase()}</span>
              <span className={styles.info}>
                <span className={styles.ti}>{p.name}</span>
                <span className={styles.sb}>
                  <ChannelIcon isMail={deriveChannel(p.contact) === "EMAIL"} />
                  {p.contact}
                </span>
              </span>
              <span className={`${styles.pill} ${p.sentAt ? styles.paid : styles.wait}`}>{p.sentAt ? "Galerie envoyée" : "Inscrit"}</span>
            </>
          );
          return p.sentAt ? (
            <Link key={p.id} href={`/g/${p.token}`} target="_blank" className={styles.row}>
              {content}
            </Link>
          ) : (
            <div key={p.id} className={styles.row} style={{ cursor: "default" }}>
              {content}
            </div>
          );
        })}
      </div>
    </>
  );
}
