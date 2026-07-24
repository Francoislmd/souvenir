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

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// Ajout / suppression / modification possibles à tout moment (sortie en
// cours, passée ou non commencée) — seule exception : une fois la galerie
// envoyée à un participant, sa fiche est figée (voir API /api/participants).
export function SortieParticipantsSection({
  sortieId,
  participants,
}: {
  sortieId: string;
  participants: ParticipantRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editSaving, setEditSaving] = useState(false);

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

  function startEdit(p: ParticipantRow): void {
    setEditingId(p.id);
    setEditName(p.name);
    setEditContact(p.contact);
  }

  function cancelEdit(): void {
    setEditingId(null);
  }

  async function saveEdit(participantId: string): Promise<void> {
    if (editSaving) return;
    if (!editName.trim() || !editContact.trim()) {
      toast("Prénom et contact sont requis");
      return;
    }
    setEditSaving(true);
    const res = await fetch(`/api/participants/${participantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), contact: editContact.trim() }),
    });
    setEditSaving(false);
    if (res.ok) {
      setEditingId(null);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast((body as { error?: string }).error ?? "La modification a échoué — réessayez.");
    }
  }

  async function removeParticipant(p: ParticipantRow): Promise<void> {
    if (!window.confirm(`Retirer ${p.name} de la sortie ?`)) return;
    const res = await fetch(`/api/participants/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      toast(`${p.name} a été retiré`);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast((body as { error?: string }).error ?? "La suppression a échoué — réessayez.");
    }
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
        {participants.length === 0 ? (
          <div className={styles.row} style={{ cursor: "default", color: "var(--ink-4)", fontSize: ".88rem" }}>
            Personne pour l&rsquo;instant.
          </div>
        ) : null}

        {participants.map((p, i) => {
          const variant = AV_VARIANTS[i % 3];

          if (editingId === p.id) {
            return (
              <div key={p.id} className={styles.addp} style={{ marginBottom: 0 }}>
                <input className={styles.inp} placeholder="Prénom" value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void saveEdit(p.id)} />
                <input
                  className={styles.inp}
                  placeholder="Email ou WhatsApp"
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void saveEdit(p.id)}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.sm}`} onClick={() => void saveEdit(p.id)} disabled={editSaving}>
                    {editSaving ? "…" : "OK"}
                  </button>
                  <button type="button" className={styles.rmv} aria-label="Annuler" onClick={cancelEdit}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
            );
          }

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

          if (p.sentAt) {
            return (
              <Link key={p.id} href={`/g/${p.token}`} target="_blank" className={styles.row}>
                {content}
              </Link>
            );
          }

          return (
            <div key={p.id} className={styles.row} style={{ cursor: "default" }}>
              {content}
              <button type="button" className={styles.rmv} aria-label="Modifier" onClick={() => startEdit(p)}>
                <PencilIcon />
              </button>
              <button type="button" className={styles.rmv} aria-label="Retirer" onClick={() => void removeParticipant(p)}>
                <TrashIcon />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
