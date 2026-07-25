"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { PhotoDropZone } from "@/components/photos/PhotoDropZone";
import { AssignmentLanes, AV_VARIANTS, type LanePhoto } from "@/components/photos/AssignmentLanes";
import { SendCascade, type SendParticipant } from "@/components/photos/SendCascade";
import { GroupShareActions } from "@/components/sorties/GroupShareActions";
import { useToast } from "@/components/operator/ToastProvider";
import { getUploadItemsForSortie } from "@/lib/idb";

interface Participant {
  id: string;
  name: string;
  contact: string;
}

type Phase = "drop" | "lanes" | "sending" | "sent";

export function PhotosFlow({
  sortieId,
  mode,
  shareUrl,
  initialPhase,
  participants,
  initialPhotos,
}: {
  sortieId: string;
  mode: "INDIVIDUEL" | "GROUPE";
  shareUrl: string | null;
  initialPhase: "drop" | "lanes" | "sent";
  participants: Participant[];
  initialPhotos: LanePhoto[];
}) {
  const router = useRouter();
  const toast = useToast();
  const isGroup = mode === "GROUPE";
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [photos, setPhotos] = useState<LanePhoto[]>(initialPhotos);
  const [publishing, setPublishing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addingMore, setAddingMore] = useState(false);
  const thumbPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Aperçu local instantané (fichier déjà sur l'appareil, pas besoin d'attendre
  // le serveur) — sert de repli tant que la vraie miniature n'est pas prête.
  const [localPreviews, setLocalPreviews] = useState<Map<string, string>>(new Map());
  const localPreviewsRef = useRef<Map<string, string>>(new Map());

  const refreshLocalPreviews = useCallback(async () => {
    const items = await getUploadItemsForSortie(sortieId);
    const next = new Map<string, string>();
    for (const item of items) {
      if (!item.photoId) continue;
      const existingUrl = localPreviewsRef.current.get(item.photoId);
      next.set(item.photoId, existingUrl ?? URL.createObjectURL(item.file));
    }
    localPreviewsRef.current.forEach((url, photoId) => {
      if (!next.has(photoId)) URL.revokeObjectURL(url);
    });
    localPreviewsRef.current = next;
    setLocalPreviews(new Map(next));
  }, [sortieId]);

  useEffect(() => {
    void refreshLocalPreviews();
  }, [refreshLocalPreviews]);

  useEffect(() => {
    const urls = localPreviewsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

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
    void refreshLocalPreviews();
  }, [fetchPhotos, refreshLocalPreviews]);

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

  // Mode GROUPE : pas de répartition manuelle — dépôt puis publication
  // directe (critère d'acceptation #3). Le clustering EXIF tourne côté
  // serveur (lib/group-publish.ts) pendant l'affichage de cet écran.
  async function publishGroup(): Promise<void> {
    setPublishing(true);
    setPhase("sending");
    const res = await fetch(`/api/sorties/${sortieId}/publish`, { method: "POST" });
    setPublishing(false);
    if (res.ok) {
      setPhase("sent");
      router.refresh();
    } else {
      setPhase("lanes");
      toast("La publication a échoué — réessayez.");
    }
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

  if (isGroup) {
    if (phase === "drop") {
      return (
        <div id="phDrop">
          <h1 className={styles.h1}>Les photos</h1>
          <p className={styles.lead}>Videz votre carte mémoire d&rsquo;un coup. Aucun tri à faire — la publication regroupe tout par créneau.</p>
          <PhotoDropZone sortieId={sortieId} onAllRegistered={onAllRegistered} />
        </div>
      );
    }

    if (phase === "sending") {
      return (
        <div id="phPublishing">
          <h1 className={styles.h1}>Publication…</h1>
          <p className={styles.lead}>On regroupe vos photos par créneau à partir de l&rsquo;heure de prise de vue. Ça prend quelques secondes.</p>
        </div>
      );
    }

    if (phase === "sent") {
      const shortLabel = (shareUrl ?? "").replace(/^https?:\/\//, "");
      return (
        <div id="phPub">
          <h1 className={styles.h1}>Galerie publiée</h1>
          <p className={styles.lead}>Vos clients choisissent leur créneau et retrouvent leurs photos.</p>
          <div className={styles.linkcard} style={{ marginTop: 20 }}>
            <div className={styles.lt}>Le lien à partager</div>
            <div className={styles.linkrow}>
              <code>{shortLabel}</code>
              <button
                type="button"
                className={`${styles.btn} ${styles.ghost} ${styles.sm}`}
                onClick={async () => {
                  if (shareUrl) {
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                    } catch {
                      // presse-papiers indisponible — le lien reste lisible dans la carte
                    }
                  }
                  toast("Lien copié");
                }}
              >
                Copier
              </button>
            </div>
            {shareUrl ? <GroupShareActions shareUrl={shareUrl} /> : null}
          </div>
          <div className={styles.soon} style={{ marginTop: 14 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--aqua)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: 1 }}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 16v-5M12 8v.5" />
            </svg>
            <div>
              <div className={styles.t}>Photos regroupées par créneau</div>
              <div className={styles.h}>Le découpage se fait sur l&rsquo;horaire des prises de vue. Chacun retrouve son groupe sans que vous ayez rien à trier.</div>
            </div>
          </div>
          <div className={styles.act}>
            <button type="button" className={`${styles.btn} ${styles.full}`} onClick={() => router.push("/sorties")}>
              Revenir à mes sorties
            </button>
          </div>
        </div>
      );
    }

    // phase === "lanes" en mode GROUPE : dépôt terminé, prêt à publier — pas
    // d'écran de répartition (critère d'acceptation #3).
    return (
      <div id="phReady">
        <h1 className={styles.h1}>Prêtes à publier</h1>
        <p className={styles.lead}>
          {photos.length} photo{photos.length > 1 ? "s" : ""} déposée{photos.length > 1 ? "s" : ""}. La publication les regroupe par créneau, sans rien à trier.
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
        <div className={styles.thumbs} style={{ marginTop: 16 }}>
          {photos.map((p) => {
            const src = p.thumbUrl ?? localPreviews.get(p.id) ?? null;
            const on = selected.has(p.id);
            return (
              <span
                key={p.id}
                className={`${styles.th2} ${on ? styles["th2-selected"] : ""}`}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                onClick={() => toggleSelect(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleSelect(p.id);
                  }
                }}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" draggable={false} />
                ) : null}
                <span className={`${styles["th2-check"]} ${on ? styles.on : ""}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              </span>
            );
          })}
        </div>

        {selected.size > 0 ? (
          <div className={styles.assignbar}>
            <span className={styles["assignbar-count"]}>
              {selected.size} photo{selected.size > 1 ? "s" : ""}
            </span>
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
            <button type="button" className={`${styles.btn} ${styles.full}`} onClick={() => void publishGroup()} disabled={publishing || photos.length === 0}>
              {publishing ? "Publication…" : "Publier les photos"}
            </button>
          </div>
        )}
      </div>
    );
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
          <AssignmentLanes
            photos={photos}
            participants={participants}
            selected={selected}
            onToggleSelect={toggleSelect}
            localPreviewUrls={localPreviews}
          />
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
