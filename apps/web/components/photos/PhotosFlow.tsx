"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { PhotoDropZone } from "@/components/photos/PhotoDropZone";
import { AssignmentLanes, AV_VARIANTS, type LanePhoto } from "@/components/photos/AssignmentLanes";
import { SendCascade, type SendParticipant } from "@/components/photos/SendCascade";
import { useToast } from "@/components/operator/ToastProvider";

interface Participant {
  id: string;
  name: string;
  contact: string;
}

type Phase = "drop" | "lanes" | "sending" | "sent";

export function PhotosFlow({
  sortieId,
  initialPhase,
  participants,
  initialPhotos,
}: {
  sortieId: string;
  initialPhase: "drop" | "lanes" | "sent";
  participants: Participant[];
  initialPhotos: LanePhoto[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [photos, setPhotos] = useState<LanePhoto[]>(initialPhotos);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addingMore, setAddingMore] = useState(false);
  const thumbPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPhotos = useCallback(async (): Promise<{ id: string; status: string; ownerId: string | null; thumbUrl: string | null }[]> => {
    const res = await fetch(`/api/sorties/${sortieId}/photos`);
    if (!res.ok) return [];
    const data = (await res.json()) as { photos: { id: string; status: string; ownerId: string | null; thumbUrl: string | null }[] };
    return data.photos;
  }, [sortieId]);

  // Pas de répartition automatique — les photos arrivent communes (ownerId
  // null), le pro les attribue lui-même. Dès que les fiches existent côté
  // serveur (pas besoin d'attendre l'envoi des fichiers ni les miniatures),
  // on affiche directement l'écran de tri.
  const onAllRegistered = useCallback(async () => {
    const fresh = await fetchPhotos();
    setPhotos(fresh.map((p) => ({ id: p.id, ownerId: p.ownerId, thumbUrl: p.thumbUrl })));
    setPhase("lanes");
  }, [fetchPhotos]);

  // Les miniatures arrivent en tâche de fond pendant que le pro trie déjà —
  // on complète discrètement les vignettes manquantes, sans jamais bloquer
  // ni afficher d'écran de chargement.
  useEffect(() => {
    if (phase !== "lanes") return;
    if (photos.every((p) => p.thumbUrl)) return;
    let cancelled = false;

    async function fillThumbs(): Promise<void> {
      const fresh = await fetchPhotos();
      if (cancelled) return;
      const freshById = new Map(fresh.map((p) => [p.id, p]));
      setPhotos((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          if (p.thumbUrl) return p;
          const match = freshById.get(p.id);
          if (!match?.thumbUrl) return p;
          changed = true;
          return { ...p, thumbUrl: match.thumbUrl };
        });
        return changed ? next : prev;
      });
    }

    thumbPollRef.current = setInterval(() => void fillThumbs(), 3000);
    return () => {
      cancelled = true;
      if (thumbPollRef.current) clearInterval(thumbPollRef.current);
    };
  }, [phase, photos, fetchPhotos]);

  async function handleSend(): Promise<void> {
    setPhase("sending");
    await fetch(`/api/sorties/${sortieId}/send`, { method: "POST" });
  }

  function toggleSelect(photoId: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  async function assignSelected(ownerId: string | null): Promise<void> {
    const ids = new Set(selected);
    if (ids.size === 0) return;
    const previous = photos;
    // Optimiste : les vignettes changent de voie tout de suite, on corrige si l'appel échoue.
    setPhotos((prev) => prev.map((p) => (ids.has(p.id) ? { ...p, ownerId } : p)));
    setSelected(new Set());
    const results = await Promise.all(
      Array.from(ids).map((id) =>
        fetch(`/api/photos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerId }),
        }).then((res) => res.ok),
      ),
    );
    if (results.some((ok) => !ok)) {
      setPhotos(previous);
      toast("L'attribution a échoué — réessayez.");
    }
  }

  async function deleteSelected(): Promise<void> {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const confirmed = window.confirm(
      `Supprimer ${ids.length} photo${ids.length > 1 ? "s" : ""} ? Cette action est définitive.`,
    );
    if (!confirmed) return;
    const previous = photos;
    setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
    const results = await Promise.all(ids.map((id) => fetch(`/api/photos/${id}`, { method: "DELETE" }).then((res) => res.ok)));
    if (results.some((ok) => !ok)) {
      setPhotos(previous);
      toast("La suppression a échoué pour certaines photos — réessayez.");
    }
  }

  if (phase === "drop") {
    return (
      <div id="phDrop">
        <h1 className={styles.h1}>Les photos</h1>
        <p className={styles.lead}>Videz votre carte mémoire d&rsquo;un coup. Le tri par client se fait tout seul.</p>
        <PhotoDropZone sortieId={sortieId} onAllRegistered={onAllRegistered} />
      </div>
    );
  }

  if (phase === "lanes") {
    return (
      <div id="phSort">
        <h1 className={styles.h1}>Chacun les siennes</h1>
        <p className={styles.lead}>
          Triées dans l&rsquo;ordre de dépôt. Sélectionnez des photos puis attribuez-les à un participant ou à tous pour corriger avant l&rsquo;envoi.
        </p>

        <div style={{ marginTop: 14 }}>
          <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.sm}`} onClick={() => setAddingMore((v) => !v)}>
            {addingMore ? "Fermer" : "+ Ajouter des photos"}
          </button>
        </div>
        {addingMore ? (
          <div style={{ marginTop: 14 }}>
            <PhotoDropZone sortieId={sortieId} onAllRegistered={onAllRegistered} />
          </div>
        ) : null}

        <div style={{ marginTop: 20 }}>
          <AssignmentLanes photos={photos} participants={participants} selected={selected} onToggleSelect={toggleSelect} />
        </div>

        {selected.size > 0 ? (
          <div className={styles.assignbar}>
            <span className={styles["assignbar-count"]}>
              {selected.size} photo{selected.size > 1 ? "s" : ""}
            </span>
            <button type="button" className={styles["assignbar-chip"]} onClick={() => void assignSelected(null)}>
              <span className={styles.av} style={{ width: 20, height: 20, fontSize: ".55rem", background: "var(--ink-3)" }}>
                TS
              </span>
              Tous
            </button>
            {participants.map((p, i) => {
              const variant = AV_VARIANTS[i % 3];
              return (
                <button key={p.id} type="button" className={styles["assignbar-chip"]} onClick={() => void assignSelected(p.id)}>
                  <span className={`${styles.av} ${variant ? styles[variant] : ""}`} style={{ width: 20, height: 20, fontSize: ".55rem" }}>
                    {p.name.slice(0, 2).toUpperCase()}
                  </span>
                  {p.name}
                </button>
              );
            })}
            <button
              type="button"
              className={`${styles["assignbar-chip"]} ${styles["assignbar-chip-danger"]}`}
              onClick={() => void deleteSelected()}
            >
              Supprimer
            </button>
            <button type="button" className={styles["assignbar-chip"]} onClick={() => setSelected(new Set())}>
              Annuler
            </button>
          </div>
        ) : (
          <div className={styles.act}>
            <button type="button" className={`${styles.btn} ${styles.full}`} onClick={handleSend} disabled={participants.length === 0}>
              Envoyer à mes {participants.length} client{participants.length > 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (phase === "sending") {
    const sendParticipants: SendParticipant[] = participants.map((p) => ({
      id: p.id,
      name: p.name,
      contact: p.contact,
      photoCount: photos.filter((ph) => ph.ownerId === p.id || ph.ownerId === null).length,
    }));
    return (
      <div id="phSend">
        <h1 className={styles.h1}>C&rsquo;est parti</h1>
        <p className={styles.lead}>Chacun reçoit ses photos, et seulement les siennes, par email ou WhatsApp.</p>
        <div style={{ marginTop: 20 }}>
          <SendCascade
            participants={sendParticipants}
            onDone={() => {
              setPhase("sent");
              toast(`Envoyé à ${participants.length} clients`);
            }}
          />
        </div>
      </div>
    );
  }

  // sent
  return (
    <div id="phSend">
      <h1 className={styles.h1}>C&rsquo;est parti</h1>
      <p className={styles.lead}>Chacun reçoit ses photos, et seulement les siennes, par email ou WhatsApp.</p>
      <div style={{ marginTop: 20 }}>
        <SendCascade
          animate={false}
          participants={participants.map((p) => ({ id: p.id, name: p.name, contact: p.contact, photoCount: photos.filter((ph) => ph.ownerId === p.id || ph.ownerId === null).length }))}
        />
      </div>
      <div className={styles.act}>
        <button type="button" className={`${styles.btn} ${styles.full}`} onClick={() => router.push("/sorties")}>
          Revenir à mes sorties
        </button>
      </div>
    </div>
  );
}
