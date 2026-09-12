"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/operator/ToastProvider";

export interface ClientRow {
  id: string;
  name: string;
  contact: string;
  sentAt: string | null;
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/**
 * Les clients d'une sortie nominative, sur l'écran de la sortie elle-même.
 * La suppression demande confirmation en place (une deuxième pression sur la
 * croix) plutôt que par `window.confirm`, qui sortait de l'application.
 */
export function ClientsSection({ sortieId, clients }: { sortieId: string; clients: ClientRow[] }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function add(): Promise<void> {
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
    } else {
      toast("L'ajout a échoué — réessayez.");
    }
  }

  async function saveEdit(id: string): Promise<void> {
    if (saving) return;
    if (!editName.trim() || !editContact.trim()) {
      toast("Prénom et contact sont requis");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/participants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), contact: editContact.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      setEditingId(null);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast((body as { error?: string }).error ?? "La modification a échoué — réessayez.");
    }
  }

  async function remove(client: ClientRow): Promise<void> {
    const res = await fetch(`/api/participants/${client.id}`, { method: "DELETE" });
    setConfirmId(null);
    if (res.ok) {
      toast(`${client.name} a été retiré`);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast((body as { error?: string }).error ?? "La suppression a échoué — réessayez.");
    }
  }

  return (
    <>
      <p className={styles.sDay}>Vos clients</p>

      <div className={styles.sdAdd}>
        <input
          className={styles.sdInp}
          placeholder="Prénom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void add()}
        />
        <input
          className={styles.sdInp}
          placeholder="Email ou WhatsApp"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void add()}
        />
        <button type="button" className={`${styles.sBtn} ${styles.sBtnInk} ${styles.sBtnSm}`} onClick={() => void add()} disabled={saving}>
          {saving ? <Spinner size={15} tone="current" /> : null}
          {saving ? "Ajout…" : "Ajouter"}
        </button>
      </div>

      <div className={styles.sdClients}>
        {clients.length === 0 ? <p className={styles.sdNote}>Personne pour l&rsquo;instant.</p> : null}

        {clients.map((c) =>
          editingId === c.id ? (
            <div key={c.id} className={styles.sdAdd}>
              <input className={styles.sdInp} value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void saveEdit(c.id)} />
              <input className={styles.sdInp} value={editContact} onChange={(e) => setEditContact(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void saveEdit(c.id)} />
              <button type="button" className={`${styles.sBtn} ${styles.sBtnInk} ${styles.sBtnSm}`} onClick={() => void saveEdit(c.id)} disabled={saving}>
                {saving ? <Spinner size={15} tone="current" /> : null}
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          ) : (
            <div key={c.id} className={styles.sdClient}>
              <span className={styles.sdAv}>{c.name.slice(0, 2).toUpperCase()}</span>
              <span className={styles.sdClientMain}>
                <b>{c.name}</b>
                <span>{c.contact}</span>
              </span>
              {confirmId === c.id ? (
                <>
                  <button type="button" className={`${styles.sdChip} ${styles.sdChipDanger}`} onClick={() => void remove(c)}>
                    Retirer {c.name}
                  </button>
                  <button type="button" className={`${styles.sdChip} ${styles.sdChipGhost}`} onClick={() => setConfirmId(null)}>
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.sdIconBtn}
                    aria-label={`Modifier ${c.name}`}
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                      setEditContact(c.contact);
                    }}
                  >
                    <PencilIcon />
                  </button>
                  <button type="button" className={styles.sdIconBtn} aria-label={`Retirer ${c.name}`} onClick={() => setConfirmId(c.id)}>
                    <CrossIcon />
                  </button>
                </>
              )}
            </div>
          ),
        )}
      </div>
    </>
  );
}
