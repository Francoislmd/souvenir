"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { PhotoDropZone } from "@/components/photos/PhotoDropZone";
import { AssignmentLanes, type LanePhoto } from "@/components/photos/AssignmentLanes";
import { SendCascade, type SendParticipant } from "@/components/photos/SendCascade";
import { useToast } from "@/components/operator/ToastProvider";

interface Participant {
  id: string;
  name: string;
  contact: string;
}

type Phase = "drop" | "processing" | "assigning" | "lanes" | "sending" | "sent";

export function PhotosFlow({
  sortieId,
  initialPhase,
  participants,
  initialPhotos,
}: {
  sortieId: string;
  initialPhase: "drop" | "processing" | "lanes" | "sent";
  participants: Participant[];
  initialPhotos: LanePhoto[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [photos, setPhotos] = useState<LanePhoto[]>(initialPhotos);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPhotos = useCallback(async (): Promise<{ id: string; status: string; ownerId: string | null; thumbUrl: string | null }[]> => {
    const res = await fetch(`/api/sorties/${sortieId}/photos`);
    if (!res.ok) return [];
    const data = (await res.json()) as { photos: { id: string; status: string; ownerId: string | null; thumbUrl: string | null }[] };
    return data.photos;
  }, [sortieId]);

  const runAssign = useCallback(async () => {
    setPhase("assigning");
    await fetch(`/api/sorties/${sortieId}/assign`, { method: "POST" });
    const fresh = await fetchPhotos();
    setPhotos(fresh.map((p) => ({ id: p.id, ownerId: p.ownerId, thumbUrl: p.thumbUrl })));
    setPhase("lanes");
  }, [sortieId, fetchPhotos]);

  const onAllUploaded = useCallback(() => {
    setPhase("processing");
  }, []);

  // Reprise après rechargement de page / onglet fermé pendant le traitement :
  // on vérifie tout de suite (pas d'attente de 3s) plutôt que d'afficher un
  // dépôt vide pendant que des photos sont déjà en cours de traitement.
  useEffect(() => {
    if (phase !== "processing") return;
    let cancelled = false;

    async function check(): Promise<void> {
      const fresh = await fetchPhotos();
      const allSettled = fresh.length > 0 && fresh.every((p) => p.status === "READY" || p.status === "FAILED");
      if (cancelled) return;
      if (allSettled) {
        if (pollRef.current) clearInterval(pollRef.current);
        void runAssign();
      }
    }

    void check();
    pollRef.current = setInterval(() => void check(), 3000);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [phase, fetchPhotos, runAssign]);

  async function handleSend(): Promise<void> {
    setPhase("sending");
    await fetch(`/api/sorties/${sortieId}/send`, { method: "POST" });
  }

  async function handleReassign(photoId: string, ownerId: string | null): Promise<void> {
    const previous = photos;
    // Optimiste : la vignette change de voie tout de suite, on corrige si l'appel échoue.
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, ownerId } : p)));
    const res = await fetch(`/api/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId }),
    });
    if (!res.ok) {
      setPhotos(previous);
      toast("La réassignation a échoué — réessayez.");
    }
  }

  if (phase === "drop" || phase === "processing" || phase === "assigning") {
    return (
      <div id="phDrop">
        <h1 className={styles.h1}>Les photos</h1>
        <p className={styles.lead}>Videz votre carte mémoire d&rsquo;un coup. Le tri par client se fait tout seul.</p>
        {/* Les vignettes restent visibles dès le dépôt — jamais d'écran vide
            pendant le traitement/la répartition serveur. */}
        <PhotoDropZone sortieId={sortieId} processing={phase !== "drop"} onAllUploaded={onAllUploaded} />
      </div>
    );
  }

  if (phase === "lanes") {
    return (
      <div id="phSort">
        <h1 className={styles.h1}>Chacun les siennes</h1>
        <p className={styles.lead}>
          Triées dans l&rsquo;ordre de dépôt. Glissez une photo vers une autre voie pour corriger avant l&rsquo;envoi.
        </p>
        <div style={{ marginTop: 20 }}>
          <AssignmentLanes photos={photos} participants={participants} editable onReassign={handleReassign} />
        </div>
        <div className={styles.act}>
          <button type="button" className={`${styles.btn} ${styles.full}`} onClick={handleSend} disabled={participants.length === 0}>
            Envoyer à mes {participants.length} client{participants.length > 1 ? "s" : ""}
          </button>
        </div>
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
