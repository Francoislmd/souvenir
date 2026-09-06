"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import styles from "@/app/(operator)/operator.module.css";
import { formatEuros } from "@/lib/format";
import { useToast } from "@/components/operator/ToastProvider";
import { PhotoDropZone, type PhotoDropZoneHandle } from "@/components/photos/PhotoDropZone";
import { useUploadQueue } from "@/components/photos/UploadQueueProvider";
import { AppHeader } from "@/components/operator/AppHeader";
import { ClientsSection } from "@/components/sorties/ClientsSection";

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
 * jamais de bouton grisé — ni d'écran qui attend : le dépôt est instantané
 * (les vignettes viennent des fichiers déjà sur l'appareil), l'envoi tourne en
 * tâche de fond dans tout l'espace pro, et publier avant la fin du transfert
 * programme l'envoi au lieu de faire patienter.
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
  const upload = useUploadQueue();
  const state = upload.forSortie(sortieId);
  const scheduled = upload.scheduledFor(sortieId);

  const [photos, setPhotos] = useState<ScreenPhoto[]>(initialPhotos);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Ouvre le sélecteur de fichiers du dépôt, depuis n'importe quel bouton.
  const dropZone = useRef<PhotoDropZoneHandle | null>(null);
  // Pendant une attribution ou une suppression, la relecture de fond ne doit
  // pas réécrire par-dessus l'affichage optimiste.
  const mutating = useRef(false);

  const fetchPhotos = useCallback(async (): Promise<ScreenPhoto[]> => {
    const res = await fetch(`/api/sorties/${sortieId}/photos`);
    if (!res.ok) return [];
    const data = (await res.json()) as { photos: ScreenPhoto[] };
    return data.photos.map((p) => ({ id: p.id, ownerId: p.ownerId, thumbUrl: p.thumbUrl }));
  }, [sortieId]);

  // Une seule boucle de rattrapage : elle tourne pendant que la file travaille
  // (les fiches et les miniatures arrivent au fil de l'eau) et tant qu'une
  // photo n'a pas sa miniature. Rien n'attend jamais son tour à l'écran.
  const needsCatchUp = state.working || photos.some((p) => !p.thumbUrl);
  useEffect(() => {
    if (!needsCatchUp) return;
    let cancelled = false;
    const timer = setInterval(() => {
      void (async () => {
        if (mutating.current) return;
        const fresh = await fetchPhotos();
        if (cancelled || mutating.current) return;
        setPhotos((prev) => {
          if (prev.length === fresh.length && prev.every((p, i) => p.id === fresh[i]?.id && p.thumbUrl === fresh[i]?.thumbUrl && p.ownerId === fresh[i]?.ownerId)) {
            return prev;
          }
          return fresh;
        });
      })();
    }, 2500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [needsCatchUp, fetchPhotos]);

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
    mutating.current = true;
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
    mutating.current = false;
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
    mutating.current = true;
    setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
    setConfirmDelete(false);
    const results = await Promise.all(ids.map((id) => fetch(`/api/photos/${id}`, { method: "DELETE" }).then((res) => res.ok)));
    if (results.some((ok) => !ok)) {
      mutating.current = false;
      setPhotos(previous);
      toast("La suppression a échoué pour certaines photos — réessayez.");
      return;
    }
    // Une photo supprimée doit aussi disparaître de la file locale : sinon elle
    // continue d'être comptée dans l'avancement et son aperçu local survit à sa
    // suppression.
    await upload.forgetPhotos(sortieId, ids);
    mutating.current = false;
    // La liste des sorties affiche un nombre de photos rendu côté serveur : il
    // restait périmé après une suppression comme après un dépôt.
    router.refresh();
  }

  async function publish(): Promise<void> {
    if (busy) return;
    // Publier n'attend pas la fin du transfert : la demande est enregistrée et
    // part toute seule dès que la dernière photo est prête.
    if (state.working) {
      upload.schedulePublish({ sortieId, isGroup, clients: clients.length, requestedAt: Date.now() });
      toast(isGroup ? "Publication programmée" : "Envoi programmé");
      return;
    }
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

  // Les photos déposées à l'instant s'affichent avant tout aller-retour réseau :
  // le fichier est déjà sur l'appareil, sa vignette aussi.
  const known = new Set(photos.map((p) => p.id));
  const fresh = state.items.filter((item) => item.status !== "failed" && (!item.photoId || !known.has(item.photoId)));
  const localByPhoto = new Map<string, string>();
  for (const item of state.items) {
    if (!item.photoId) continue;
    const url = upload.previewUrl(item.id);
    if (url) localByPhoto.set(item.photoId, url);
  }

  const photoCount = photos.length + fresh.length;
  const empty = photoCount === 0;
  const selectable = !published;

  const grid = (
    <div className={`${styles.sdGrid} ${selected.size > 0 ? styles.sdGridPicking : ""}`}>
      {photos.map((p) => {
        const src = p.thumbUrl ?? localByPhoto.get(p.id) ?? null;
        const on = selected.has(p.id);
        const waiting = state.pending.has(p.id);
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
      {fresh.map((item) => {
        const src = upload.previewUrl(item.id);
        return (
          <span key={item.id} className={`${styles.sdPh} ${styles.sdPhPending}`} style={{ cursor: "default" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {src ? <img src={src} alt="" draggable={false} /> : null}
          </span>
        );
      })}
    </div>
  );

  // Une photo abandonnée après plusieurs tentatives se dit, et se rattrape —
  // avant, la file réessayait indéfiniment sans jamais rien annoncer.
  const failedNotice =
    state.failed > 0 ? (
      <p className={styles.sdNote}>
        {state.failed} photo{state.failed > 1 ? "s" : ""} n&rsquo;{state.failed > 1 ? "ont" : "a"} pas pu être envoyée
        {state.failed > 1 ? "s" : ""}.{" "}
        <button type="button" className={`${styles.sdChip} ${styles.sdChipGhost}`} onClick={() => upload.retryFailed(sortieId)}>
          Réessayer
        </button>
      </p>
    ) : null;

  // Discret, sous la ligne d'action : l'envoi se voit, il n'empêche rien.
  const transferLine = state.working ? (
    <div className={styles.sdTransfer}>
      <span className={styles.sdProg}>
        <span className={styles.sdProgFill} style={{ width: `${Math.round(state.ratio * 100)}%` }} />
      </span>
      <span className={styles.sdTransferText}>
        {state.sent < state.total
          ? `Envoi en cours · ${state.sent} sur ${state.total} · ${Math.round(state.ratio * 100)} %`
          : `Préparation des aperçus · ${state.done} sur ${state.total}`}
        {" — "}
        vous pouvez continuer, même sur un autre écran.
      </span>
    </div>
  ) : null;

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
  } else if (!published && photoCount > 0) {
    const needsClients = !isGroup && clients.length === 0;
    bar = (
      <div className={styles.sdBar}>
        <div className={styles.sdBarIn}>
          <span className={styles.sdBarText}>
            <b>
              {photoCount} photo{photoCount > 1 ? "s" : ""} déposée{photoCount > 1 ? "s" : ""}.
            </b>{" "}
            <span>
              {scheduled
                ? isGroup
                  ? "La galerie sera publiée dès la fin de l'envoi."
                  : "Vos clients les recevront dès la fin de l'envoi."
                : needsClients
                  ? "Ajoutez au moins un client pour les envoyer."
                  : isGroup
                    ? "Vos clients les retrouveront par créneau."
                    : `Vos ${clients.length} client${clients.length > 1 ? "s" : ""} les recevront toutes.`}
            </span>
          </span>
          <span className={styles.sdBarActions}>
            <button type="button" className={styles.sdChip} onClick={() => dropZone.current?.open()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5.8v12.4M5.8 12h12.4" />
              </svg>
              <span className={styles.sdChipLabel}>Ajouter des photos</span>
            </button>
            {scheduled ? (
              <button type="button" className={`${styles.sdChip} ${styles.sdChipGhost}`} onClick={() => upload.cancelPublish(sortieId)}>
                Annuler l&rsquo;envoi programmé
              </button>
            ) : needsClients ? null : (
              <button type="button" className={`${styles.sBtn} ${styles.sBtnPri}`} onClick={() => void publish()} disabled={busy}>
                {busy ? "Publication…" : isGroup ? "Publier les photos" : `Envoyer à mes ${clients.length} client${clients.length > 1 ? "s" : ""}`}
              </button>
            )}
          </span>
        </div>
        {transferLine}
        {failedNotice}
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
                En ligne · {photoCount} photo{photoCount > 1 ? "s" : ""}
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

        {empty ? null : grid}

        <PhotoDropZone sortieId={sortieId} controlRef={dropZone} variant={empty ? "zone" : "silent"} />

        {empty ? (
          <p className={styles.sdNote}>Rien n&rsquo;est visible par vos clients tant que vous n&rsquo;avez pas publié.</p>
        ) : null}

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
