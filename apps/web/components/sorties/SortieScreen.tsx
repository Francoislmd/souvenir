"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import styles from "@/app/(operator)/operator.module.css";
import { formatEuros } from "@/lib/format";
import { useToast } from "@/components/operator/ToastProvider";
import { PhotoDropZone, type UploadProgress } from "@/components/photos/PhotoDropZone";
import { AppHeader } from "@/components/operator/AppHeader";
import { ClientsSection } from "@/components/sorties/ClientsSection";
import { getUploadItemsForSortie } from "@/lib/idb";

export interface ScreenPhoto {
  id: string;
  ownerId: string | null;
  thumbUrl: string | null;
}

export interface ScreenClient {
  id: string;
  name: string;
  contact: string;
  sentAt: string | null;
  token: string;
  paid: boolean;
  amountCents: number;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * Toute la vie d'une sortie sur un seul écran : vide → dépôt → publiée.
 *
 * L'ancien découpage (fiche sortie puis page photos) faisait de l'action
 * principale d'un écran « aller sur l'autre », et affichait un bouton
 * primaire désactivé tant que la sortie n'était pas du jour. Ici il n'y a
 * jamais de bouton grisé : pendant l'envoi la barre basse ne montre que
 * l'avancement, et une sortie nominative sans client dit ce qui manque au
 * lieu de proposer une action impossible.
 */
export function SortieScreen({
  sortieId,
  title,
  meta,
  isGroup,
  published,
  shareUrl,
  clients,
  initialPhotos,
}: {
  sortieId: string;
  title: string;
  meta: string;
  isGroup: boolean;
  published: boolean;
  shareUrl: string | null;
  clients: ScreenClient[];
  initialPhotos: ScreenPhoto[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [photos, setPhotos] = useState<ScreenPhoto[]>(initialPhotos);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ done: 0, total: 0, pending: [] });
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Aperçu local instantané (le fichier est déjà sur l'appareil) — sert de
  // repli tant que la vraie miniature n'est pas prête côté serveur.
  const [localPreviews, setLocalPreviews] = useState<Map<string, string>>(new Map());
  const localPreviewsRef = useRef<Map<string, string>>(new Map());


  const refreshLocalPreviews = useCallback(async () => {
    const items = await getUploadItemsForSortie(sortieId);
    const next = new Map<string, string>();
    for (const item of items) {
      if (!item.photoId) continue;
      const existing = localPreviewsRef.current.get(item.photoId);
      next.set(item.photoId, existing ?? URL.createObjectURL(item.file));
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

  const fetchPhotos = useCallback(async (): Promise<ScreenPhoto[]> => {
    const res = await fetch(`/api/sorties/${sortieId}/photos`);
    if (!res.ok) return [];
    const data = (await res.json()) as { photos: ScreenPhoto[] };
    return data.photos.map((p) => ({ id: p.id, ownerId: p.ownerId, thumbUrl: p.thumbUrl }));
  }, [sortieId]);

  // Dès que les fiches existent côté serveur, la grille se remplit — sans
  // attendre l'envoi des octets ni les miniatures.
  const onAllRegistered = useCallback(async () => {
    setPhotos(await fetchPhotos());
    void refreshLocalPreviews();
  }, [fetchPhotos, refreshLocalPreviews]);

  // Les miniatures arrivent en tâche de fond pendant que l'opérateur regarde
  // déjà ses photos — on complète discrètement, sans écran de chargement.
  useEffect(() => {
    if (photos.length === 0 || photos.every((p) => p.thumbUrl)) return;
    let cancelled = false;
    const timer = setInterval(() => {
      void (async () => {
        const fresh = await fetchPhotos();
        if (cancelled) return;
        const byId = new Map(fresh.map((p) => [p.id, p]));
        setPhotos((prev) => {
          let changed = false;
          const next = prev.map((p) => {
            if (p.thumbUrl) return p;
            const match = byId.get(p.id);
            if (!match?.thumbUrl) return p;
            changed = true;
            return { ...p, thumbUrl: match.thumbUrl };
          });
          return changed ? next : prev;
        });
      })();
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [photos, fetchPhotos]);

  useEffect(() => {
    if (!published || !shareUrl || qrDataUrl) return;
    void QRCode.toDataURL(shareUrl, { width: 480, margin: 2, color: { dark: "#161320", light: "#FFFFFF" } }).then(setQrDataUrl);
  }, [published, shareUrl, qrDataUrl]);

  function toggleSelect(photoId: string): void {
    setConfirmDelete(false);
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
    // Optimiste : les vignettes changent de main tout de suite, on corrige si l'appel échoue.
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
    } else {
      toast(ownerId === null ? "Rendues visibles par tous" : "Réservées");
    }
  }

  async function deleteSelected(): Promise<void> {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const previous = photos;
    setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
    setConfirmDelete(false);
    const results = await Promise.all(ids.map((id) => fetch(`/api/photos/${id}`, { method: "DELETE" }).then((res) => res.ok)));
    if (results.some((ok) => !ok)) {
      setPhotos(previous);
      toast("La suppression a échoué pour certaines photos — réessayez.");
    }
  }

  async function publish(): Promise<void> {
    if (busy) return;
    setBusy(true);
    const endpoint = isGroup ? `/api/sorties/${sortieId}/publish` : `/api/sorties/${sortieId}/send`;
    const res = await fetch(endpoint, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      toast(isGroup ? "Galerie publiée" : `Envoyé à ${clients.length} client${clients.length > 1 ? "s" : ""}`);
      router.refresh();
    } else {
      toast("La publication a échoué — réessayez.");
    }
  }

  async function copyLink(): Promise<void> {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Presse-papiers indisponible — le lien reste lisible et sélectionnable.
    }
    toast("Lien copié");
  }

  async function share(): Promise<void> {
    if (!shareUrl) return;
    const nav = navigator as Navigator & { share?: (data: { title: string; url: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: "Vos photos", url: shareUrl });
        return;
      } catch {
        // Partage annulé — on retombe sur la copie du lien.
      }
    }
    await copyLink();
  }

  const uploading = progress.total > 0 && progress.done < progress.total;
  const pending = new Set(progress.pending);
  const empty = photos.length === 0 && !uploading;
  const selectable = !published;

  const grid = (
    <div className={`${styles.sdGrid} ${selected.size > 0 ? styles.sdGridPicking : ""}`}>
      {photos.map((p) => {
        const src = p.thumbUrl ?? localPreviews.get(p.id) ?? null;
        const on = selected.has(p.id);
        const waiting = pending.has(p.id);
        return (
          <span
            key={p.id}
            className={`${styles.sdPh} ${on ? styles.sdPhOn : ""} ${waiting ? styles.sdPhPending : ""}`}
            role={selectable ? "button" : undefined}
            tabIndex={selectable ? 0 : undefined}
            aria-pressed={selectable ? on : undefined}
            style={selectable ? undefined : { cursor: "default" }}
            onClick={selectable ? () => toggleSelect(p.id) : undefined}
            onKeyDown={
              selectable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSelect(p.id);
                    }
                  }
                : undefined
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {src ? <img src={src} alt="" draggable={false} /> : null}
            {selectable ? (
              <span className={`${styles.sdPhCheck} ${on ? styles.sdPhCheckOn : ""}`}>
                <CheckIcon />
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );

  let bar: React.ReactNode = null;

  if (selected.size > 0) {
    bar = (
      <div className={styles.sdBar}>
        <div className={styles.sdBarIn}>
          <span className={styles.sdBarText}>
            <b>
              {selected.size} photo{selected.size > 1 ? "s" : ""}
            </b>{" "}
            <span>sélectionnée{selected.size > 1 ? "s" : ""}</span>
          </span>
          <span className={styles.sdBarActions}>
            {!isGroup && clients.length > 0 ? (
              <>
                <button type="button" className={styles.sdChip} onClick={() => void assignSelected(null)}>
                  Visibles par tous
                </button>
                {clients.map((c) => (
                  <button key={c.id} type="button" className={styles.sdChip} onClick={() => void assignSelected(c.id)}>
                    Réserver à {c.name}
                  </button>
                ))}
              </>
            ) : null}
            {confirmDelete ? (
              <button type="button" className={`${styles.sdChip} ${styles.sdChipDanger}`} onClick={() => void deleteSelected()}>
                Supprimer définitivement
              </button>
            ) : (
              <button type="button" className={`${styles.sdChip} ${styles.sdChipDanger}`} onClick={() => setConfirmDelete(true)}>
                Supprimer
              </button>
            )}
          </span>
          <button
            type="button"
            className={`${styles.sdChip} ${styles.sdChipGhost} ${styles.sdCancel}`}
            onClick={() => {
              setSelected(new Set());
              setConfirmDelete(false);
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    );
  } else if (uploading) {
    // Pendant l'envoi : pas de bouton grisé, pas de bouton du tout.
    bar = (
      <div className={styles.sdBar}>
        <div className={styles.sdProgLine}>
          <b>Envoi des photos</b>
          <span>
            {progress.done} sur {progress.total}
          </span>
        </div>
        <span className={styles.sdProg}>
          <span className={styles.sdProgFill} style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
        </span>
        <p className={styles.sdNote}>Vous pouvez ranger votre téléphone, l&rsquo;envoi continue.</p>
      </div>
    );
  } else if (!published && photos.length > 0) {
    const needsClients = !isGroup && clients.length === 0;
    bar = (
      <div className={styles.sdBar}>
        <div className={styles.sdBarIn}>
          <span className={styles.sdBarText}>
            <b>
              {photos.length} photo{photos.length > 1 ? "s" : ""} déposée{photos.length > 1 ? "s" : ""}.
            </b>{" "}
            <span>
              {needsClients
                ? "Ajoutez au moins un client pour les envoyer."
                : isGroup
                  ? "Vos clients les retrouveront par créneau."
                  : `Vos ${clients.length} client${clients.length > 1 ? "s" : ""} les recevront toutes.`}
            </span>
          </span>
          <span className={styles.sdBarActions}>
            <PhotoDropZone sortieId={sortieId} onAllRegistered={onAllRegistered} onProgress={setProgress} variant="button" />
            {needsClients ? null : (
              <button type="button" className={`${styles.sBtn} ${styles.sBtnPri}`} onClick={() => void publish()} disabled={busy}>
                {busy ? "Publication…" : isGroup ? "Publier les photos" : `Envoyer à mes ${clients.length} client${clients.length > 1 ? "s" : ""}`}
              </button>
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppHeader title={title} backHref="/sorties" backLabel="Revenir aux sorties" />

      <div className={styles.sWrap}>
        <p className={styles.sdMeta}>{meta}</p>

        {published && shareUrl ? (
          <div className={styles.sdShare}>
            <span className={styles.sdQr}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {qrDataUrl ? <img src={qrDataUrl} alt="QR code de la galerie" /> : null}
            </span>
            <span className={styles.sdShareMain}>
              <span className={styles.sdOk}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                En ligne · {photos.length} photo{photos.length > 1 ? "s" : ""}
              </span>
              <span className={styles.sdShareT}>Le lien de la galerie</span>
              <span className={styles.sdShareH}>Montrez le code au retour, ou envoyez le lien.</span>
              <span className={styles.sdShareRow}>
                <span className={styles.sdShareUrl}>{shareUrl.replace(/^https?:\/\//, "")}</span>
                <button type="button" className={`${styles.sBtn} ${styles.sBtnSm} ${styles.sdChip}`} onClick={() => void copyLink()}>
                  Copier
                </button>
                <button type="button" className={`${styles.sBtn} ${styles.sBtnPri}`} onClick={() => void share()}>
                  Partager
                </button>
              </span>
            </span>
          </div>
        ) : null}

        {empty ? (
          <>
            <PhotoDropZone sortieId={sortieId} onAllRegistered={onAllRegistered} onProgress={setProgress} />
            <p className={styles.sdNote}>Rien n&rsquo;est visible par vos clients tant que vous n&rsquo;avez pas publié.</p>
          </>
        ) : (
          grid
        )}

        {published ? (
          clients.length > 0 ? (
            <>
              <p className={styles.sDay} style={{ marginTop: 34 }}>
                Vos clients
              </p>
              <div className={styles.sdClients}>
                {clients.map((c) => (
                  <Link key={c.id} href={`/g/${c.token}`} target="_blank" className={styles.sdClient}>
                    <span className={styles.sdAv}>{c.name.slice(0, 2).toUpperCase()}</span>
                    <span className={styles.sdClientMain}>
                      <b>{c.name}</b>
                      <span>{c.contact}</span>
                    </span>
                    <span className={`${styles.sdTag} ${c.paid ? styles.sdTagPaid : styles.sdTagWait}`}>
                      {c.paid ? formatEuros(c.amountCents) : "Relance en cours"}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          ) : null
        ) : !isGroup ? (
          <div style={{ marginTop: 34 }}>
            <ClientsSection sortieId={sortieId} clients={clients.map((c) => ({ id: c.id, name: c.name, contact: c.contact, sentAt: c.sentAt }))} />
          </div>
        ) : null}

        {bar}
      </div>
    </>
  );
}
