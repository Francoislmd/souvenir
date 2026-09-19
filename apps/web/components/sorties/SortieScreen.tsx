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
import { Spinner, TileSpinner } from "@/components/ui/Spinner";
import { AppHeader } from "@/components/operator/AppHeader";
import { ClientsSection } from "@/components/sorties/ClientsSection";
import { EmailsField } from "@/components/sorties/EmailsField";
import { clientCount } from "@/lib/emails";
import { StripeOnboarding } from "@/components/stripe/StripeOnboarding";

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
 * (les vignettes viennent des fichiers déjà sur l'appareil, affichées à pleine
 * intensité tout de suite, sans état « en cours » visible), l'envoi tourne en
 * tâche de fond dans tout l'espace pro sans jauge ni pourcentage à l'écran, et
 * publier avant la fin du transfert programme l'envoi au lieu de faire
 * patienter.
 *
 * La publication, elle, se regarde : la grille reste à l'écran, grisée, et
 * chaque photo s'allume quand son aperçu filigrané est posé, sous une carte
 * qui dit l'étape en cours et le pourcentage — tout vient du serveur, rien
 * n'est simulé. L'écran ne revient jamais sur la grille « non publiée » : il
 * passe directement de l'avancement à la galerie en ligne.
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
  paymentsReady: initialPaymentsReady,
}: {
  sortieId: string;
  title: string;
  meta: string;
  isGroup: boolean;
  published: boolean;
  shareUrl: string | null;
  clients: ScreenClient[];
  initialPhotos: ScreenPhoto[];
  /** Stripe peut encaisser pour ce compte. Sans lui, publier ouvre d'abord
   *  l'inscription Stripe : une galerie en ligne où personne ne peut payer
   *  est pire qu'une galerie pas encore publiée. */
  paymentsReady: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const upload = useUploadQueue();
  const state = upload.forSortie(sortieId);
  const scheduled = upload.scheduledFor(sortieId);

  const [photos, setPhotos] = useState<ScreenPhoto[]>(initialPhotos);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  // La galerie vient d'être mise en ligne sous les yeux de l'opérateur : la
  // carte du lien arrive avec un mouvement, pas d'un coup.
  const [justPublished, setJustPublished] = useState(false);
  const [paymentsReady, setPaymentsReady] = useState(initialPaymentsReady);
  const [paymentsPending, setPaymentsPending] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [deleteSortieState, setDeleteSortieState] = useState<"idle" | "confirm" | "deleting">("idle");
  // Mode GROUPE : les adresses collées ne quittent le navigateur qu'à l'envoi.
  // Rien n'est enregistré côté serveur avant, et rien n'est conservé après.
  const [emails, setEmails] = useState<string[]>([]);
  const [sendingInvite, setSendingInvite] = useState(false);

  // Ouvre le sélecteur de fichiers du dépôt, depuis n'importe quel bouton.
  const dropZone = useRef<PhotoDropZoneHandle | null>(null);
  // Pendant une attribution ou une suppression, la relecture de fond ne doit
  // pas réécrire par-dessus l'affichage optimiste.
  const mutating = useRef(false);

  // La publication appartient à la file (UploadQueueProvider) et non à cet
  // écran : elle survit à un changement de page, et cet écran la retrouve.
  const run = upload.publicationFor(sortieId);
  const inFlight = !published && (Boolean(scheduled) || (run !== null && run.phase !== "failed"));
  const failedRun = !published && run?.phase === "failed" ? run : null;

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

  useEffect(() => {
    if (!confirmPublishOpen) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") setConfirmPublishOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmPublishOpen]);

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

  // Refusée côté serveur si une commande existe déjà pour cette sortie — la
  // fiche s'efface, mais pas un paiement.
  async function deleteSortie(): Promise<void> {
    setDeleteSortieState("deleting");
    const res = await fetch(`/api/sorties/${sortieId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/sorties");
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    toast(data?.error ?? "La suppression a échoué — réessayez.");
    setDeleteSortieState("idle");
  }

  // Confirmée, la publication ne se discute plus : la grille se grise et
  // l'avancement prend le dessus jusqu'à ce que `published` arrive. Si le
  // transfert n'est pas fini, elle est programmée et part toute seule.
  function confirmPublish(): void {
    setConfirmPublishOpen(false);
    upload.dismissPublication(sortieId);
    upload.publish({ sortieId, isGroup, clients: clients.length, requestedAt: Date.now(), emails });
  }

  // La page relue dit « publiée » : l'avancement laisse la place à la galerie
  // en ligne, sans repasser par la grille.
  const { dismissPublication } = upload;
  useEffect(() => {
    if (!published || !run) return;
    if (run.phase === "failed") {
      dismissPublication(sortieId);
      return;
    }
    setJustPublished(true);
    // Les adresses sont parties avec la publication : le champ repart vide.
    setEmails([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (run.phase === "done") dismissPublication(sortieId);
  }, [published, run, dismissPublication, sortieId]);

  // Une liste d'adresses saisies à la main par l'opérateur, pas des
  // Participant : en mode GROUPE personne n'est identifié avant l'achat.
  async function sendInvites(): Promise<boolean> {
    if (emails.length === 0) return true;
    const res = await fetch(`/api/sorties/${sortieId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails }),
    });
    if (!res.ok) return false;
    setEmails([]);
    return true;
  }

  async function sendInvitesNow(): Promise<void> {
    if (sendingInvite || emails.length === 0) return;
    setSendingInvite(true);
    const count = emails.length;
    const ok = await sendInvites();
    setSendingInvite(false);
    if (ok) {
      // Les adresses deviennent des clients « Envoyé » dans la liste juste
      // en dessous : elle est rendue côté serveur, donc il faut la relire.
      router.refresh();
      toast(`Lien envoyé à ${clientCount(count)}`);
    } else {
      toast("L'envoi a échoué, réessayez.");
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
  const selectable = !published && !inFlight;
  // GROUPE : chaque photo s'allume quand son aperçu filigrané est posé.
  const lighting = inFlight && isGroup;
  const ready = new Set(run?.readyIds ?? []);

  const grid = (
    <div className={`${styles.sdGrid} ${selected.size > 0 ? styles.sdGridPicking : ""} ${lighting ? styles.sdGridPub : ""}`}>
      {photos.map((p) => {
        const src = p.thumbUrl ?? localByPhoto.get(p.id) ?? null;
        const on = selected.has(p.id);
        return (
          <span
            key={p.id}
            className={`${styles.sdPh} ${on ? styles.sdPhOn : ""} ${lighting && ready.has(p.id) ? styles.sdPhReady : ""}`}
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
            {src ? <img src={src} alt="" draggable={false} /> : <TileSpinner size={18} />}
            {selectable ? (
              <span className={`${styles.sdPhCheck} ${on ? styles.sdPhCheckOn : ""}`}>
                <CheckIcon />
              </span>
            ) : lighting ? (
              <span className={styles.sdPhOk} aria-hidden="true">
                <CheckIcon />
              </span>
            ) : null}
          </span>
        );
      })}
      {fresh.map((item) => {
        const src = upload.previewUrl(item.id);
        return (
          <span key={item.id} className={styles.sdPh} style={{ cursor: "default" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {src ? <img src={src} alt="" draggable={false} /> : <TileSpinner size={18} />}
          </span>
        );
      })}
    </div>
  );

  // ---- Avancement de la publication ----
  // Transfert : en octets (comme la barre basse), plus les photos finies —
  // une photo arrivée doit encore être traitée avant de compter.
  const liveItems = state.items.filter((i) => i.status !== "failed");
  const readyCount = liveItems.filter((i) => i.status === "done").length;
  const bytesTotal = liveItems.reduce((sum, i) => sum + i.file.size, 0);
  const bytesSent = liveItems.reduce((sum, i) => {
    if (i.status === "queued") return sum;
    if (i.status === "uploading") return sum + (i.file.size * Math.min(100, Math.max(0, i.progress))) / 100;
    return sum + i.file.size;
  }, 0);
  const transferFrac =
    liveItems.length === 0 ? 1 : 0.8 * (bytesTotal > 0 ? bytesSent / bytesTotal : 1) + 0.2 * (readyCount / liveItems.length);
  const transferring = Boolean(scheduled) && !run;
  const showTransfer = transferring || Boolean(run?.afterTransfer);
  const phase = run?.phase ?? null;
  const invites = run ? run.invites : isGroup ? (scheduled?.emails?.length ?? 0) : 0;

  type StepState = "todo" | "on" | "done";
  const steps: { key: string; label: string; state: StepState; count?: string; weight: number; frac: number }[] = [];
  if (showTransfer) {
    steps.push({
      key: "transfer",
      label: "Transfert des dernières photos",
      state: run ? "done" : "on",
      count: run ? undefined : `${readyCount} / ${liveItems.length}`,
      weight: 3,
      frac: run ? 1 : transferFrac,
    });
  }
  if (isGroup) {
    const preparing = phase === "running";
    const prepared = phase === "sorting" || phase === "inviting" || phase === "done";
    steps.push({
      key: "watermark",
      label: "Aperçus filigranés",
      state: prepared ? "done" : preparing ? "on" : "todo",
      count: preparing && run && run.total > 0 ? `${run.done} / ${run.total}` : undefined,
      weight: 5,
      frac: prepared ? 1 : preparing && run && run.total > 0 ? run.done / run.total : 0,
    });
    steps.push({
      key: "sorting",
      label: "Classement par créneau horaire",
      state: phase === "inviting" || phase === "done" ? "done" : phase === "sorting" ? "on" : "todo",
      weight: 1,
      frac: phase === "inviting" || phase === "done" ? 1 : phase === "sorting" ? 0.4 : 0,
    });
    if (invites > 0) {
      steps.push({
        key: "invite",
        label: `Envoi du lien à ${clientCount(invites)}`,
        state: phase === "done" ? "done" : phase === "inviting" ? "on" : "todo",
        weight: 0.6,
        frac: phase === "done" ? 1 : phase === "inviting" ? 0.5 : 0,
      });
    }
  } else {
    const sending = phase === "running";
    steps.push({
      key: "send",
      label: `Envoi des galeries à vos ${clients.length} client${clients.length > 1 ? "s" : ""}`,
      state: phase === "done" ? "done" : sending ? "on" : "todo",
      count: sending && run && run.total > 0 ? `${run.done} / ${run.total}` : undefined,
      weight: 4,
      frac: phase === "done" ? 1 : sending && run && run.total > 0 ? run.done / run.total : 0,
    });
  }
  const weightSum = steps.reduce((sum, st) => sum + st.weight, 0);
  const pct =
    phase === "done" ? 100 : Math.max(3, Math.min(99, Math.round((100 * steps.reduce((sum, st) => sum + st.weight * st.frac, 0)) / (weightSum || 1))));

  const progressCard = (
    <div className={styles.sdPub}>
      <div className={styles.sdPubHead}>
        <span className={styles.sdPubMain}>
          <span className={styles.sdPubT} role="status" aria-live="polite">
            {phase === "done" ? "Mise en ligne…" : isGroup ? "Publication de la galerie" : "Envoi des photos à vos clients"}
          </span>
          <span className={styles.sdPubH}>
            {transferring
              ? "Vos photos finissent d'arriver, la suite partira toute seule. Gardez cet onglet ouvert."
              : "Vous pouvez aller ailleurs dans votre espace : tout continue tant que l'onglet reste ouvert."}
          </span>
        </span>
        <span className={styles.sdPubPct}>{pct}&nbsp;%</span>
      </div>
      <span className={styles.sdPubBar}>
        <span className={styles.sdPubFill} style={{ width: `${pct}%` }} />
      </span>
      <ol className={styles.sdSteps}>
        {steps.map((st) => (
          <li key={st.key} className={`${styles.sdStep} ${st.state === "done" ? styles.sdStepDone : st.state === "on" ? styles.sdStepOn : ""}`}>
            <span className={styles.sdStepIc}>
              {st.state === "done" ? <CheckIcon /> : st.state === "on" ? <Spinner size={14} label={st.label} /> : null}
            </span>
            <span className={styles.sdStepL}>{st.label}</span>
            {st.count ? <span className={styles.sdStepN}>{st.count}</span> : null}
          </li>
        ))}
      </ol>
      {transferring ? (
        <button type="button" className={`${styles.sdChip} ${styles.sdChipGhost} ${styles.sdPubCancel}`} onClick={() => upload.cancelPublish(sortieId)}>
          Annuler la publication
        </button>
      ) : null}
    </div>
  );

  // Un échec se dit sur place, avec de quoi relancer — pas seulement dans un
  // toast qui disparaît.
  const failedCard = failedRun ? (
    <div className={`${styles.sdPub} ${styles.sdPubFail}`} role="alert">
      <div className={styles.sdPubHead}>
        <span className={styles.sdPubMain}>
          <span className={styles.sdPubT}>{isGroup ? "La publication n'a pas abouti." : "L'envoi n'a pas abouti."}</span>
          <span className={styles.sdPubH}>
            {isGroup
              ? "Rien n'a été mis en ligne, vos photos sont intactes."
              : "Les clients déjà servis ne recevront pas l'e-mail une seconde fois."}
          </span>
        </span>
        <button type="button" className={`${styles.sBtn} ${styles.sBtnPri}`} onClick={() => confirmPublish()}>
          Réessayer
        </button>
      </div>
    </div>
  ) : null;

  // Remplace la grille à la place d'une popup : valider une publication n'a
  // rien à voir avec regarder ses photos, la grille n'a donc plus sa place à
  // l'écran pendant qu'on décide.
  const paymentsScreen = (
    <div className={styles.sdPayments}>
      <p className={styles.sdPublishingText}>Activez vos paiements pour publier.</p>
      <p className={styles.sdPublishingHint}>
        {paymentsPending
          ? "Stripe a encore besoin d'informations, ou vérifie celles que vous avez données. Reprenez quand vous voulez : vos photos restent là."
          : "Sans eux, vos clients verraient les photos sans pouvoir les acheter. Quelques minutes, avec une pièce d'identité et votre IBAN."}
      </p>
      {paymentsPending ? null : (
        <div className={styles.sdStripe}>
          <StripeOnboarding
            onDone={(ready) => {
              if (ready) {
                setPaymentsReady(true);
                router.refresh();
              } else {
                setPaymentsPending(true);
              }
            }}
          />
        </div>
      )}
      <div className={styles.sdConfirmActions}>
        <button type="button" className={`${styles.sBtn} ${styles.sBtnGhost}`} onClick={() => setConfirmPublishOpen(false)}>
          Plus tard
        </button>
        {paymentsPending ? (
          <button type="button" className={`${styles.sBtn} ${styles.sBtnPri}`} onClick={() => setPaymentsPending(false)}>
            Reprendre avec Stripe
          </button>
        ) : null}
      </div>
    </div>
  );

  const confirmScreen = (
    <div className={styles.sdPublishing}>
      <p className={styles.sdPublishingText}>{isGroup ? "Publier la galerie ?" : "Envoyer les photos ?"}</p>
      <p className={styles.sdPublishingHint}>
        {isGroup
          ? `${photoCount} photo${photoCount > 1 ? "s" : ""} deviendront visibles par tous vos clients.`
          : `${photoCount} photo${photoCount > 1 ? "s" : ""} seront envoyées à vos ${clients.length} client${clients.length > 1 ? "s" : ""}.`}
        {isGroup && emails.length > 0 ? ` Le lien partira à ${clientCount(emails.length)}.` : ""}
        {state.working ? " Le transfert n'est pas fini : l'envoi partira automatiquement dès qu'il le sera." : ""}
      </p>
      <div className={styles.sdConfirmActions}>
        <button type="button" className={`${styles.sBtn} ${styles.sBtnGhost}`} onClick={() => setConfirmPublishOpen(false)}>
          Annuler
        </button>
        <button type="button" className={`${styles.sBtn} ${styles.sBtnPri}`} onClick={() => void confirmPublish()}>
          {isGroup ? "Publier" : "Envoyer"}
        </button>
      </div>
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

  // Trois états, dans l'ordre où ils arrivent : le lien est parti, puis la
  // photo est payée. Une ligne sans envoi est une adresse ajoutée à la main
  // qui n'a pas encore reçu la sienne.
  function clientRow(c: ScreenClient): React.ReactNode {
    const inside = (
      <>
        <span className={styles.sdAv}>{c.name.slice(0, 2).toUpperCase()}</span>
        <span className={styles.sdClientMain}>
          <b>{c.name}</b>
          <span>{c.contact}</span>
        </span>
        <span className={`${styles.sdTag} ${c.paid ? styles.sdTagPaid : c.sentAt ? "" : styles.sdTagWait}`}>
          {c.paid ? formatEuros(c.amountCents) : c.sentAt ? "Envoyé" : "En attente"}
        </span>
      </>
    );
    // En mode GROUPE, /g/{token} n'est pas la boutique du client : il n'y a
    // rien à ouvrir depuis la liste.
    return isGroup ? (
      <div key={c.id} className={styles.sdClient}>
        {inside}
      </div>
    ) : (
      <Link key={c.id} href={`/g/${c.token}`} target="_blank" className={styles.sdClient}>
        {inside}
      </Link>
    );
  }

  // Le même champ avant et après la publication : seul ce qui le suit change,
  // le bouton de publication d'un côté, celui d'envoi de l'autre.
  // Une carte, pas une ligne de formulaire : remplir cette liste est la seule
  // chose que l'écran demande, elle pèse donc autant que la carte du lien.
  const emailsSection = (
    <div className={styles.sdMail}>
      <span className={styles.sdMailIc} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5.5" width="18" height="13" rx="3" />
          <path d="m3.8 7.2 7.1 5.2a2 2 0 0 0 2.2 0l7.1-5.2" />
        </svg>
      </span>
      <span className={styles.sdMailMain}>
        <span className={styles.sdMailT}>Envoyez le lien à vos clients</span>
        <span className={styles.sdMailH}>
          {published
            ? "Collez la liste de votre carnet de réservation. Seules les adresses sont retenues, sans doublon."
            : "Collez la liste de votre carnet de réservation. Vos clients recevront le lien dès la publication."}
        </span>
        <EmailsField emails={emails} onChange={setEmails} />
        {published && emails.length > 0 ? (
          <span className={styles.sdMailFoot}>
            <button
              type="button"
              className={`${styles.sBtn} ${styles.sBtnPri}`}
              onClick={() => void sendInvitesNow()}
              disabled={sendingInvite}
            >
              {sendingInvite ? <Spinner size={16} tone="current" /> : null}
              {sendingInvite ? "Envoi…" : `Envoyer à ${clientCount(emails.length)}`}
            </button>
          </span>
        ) : null}
      </span>
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
  } else if (!published && photoCount > 0) {
    const needsClients = !isGroup && clients.length === 0;
    const pasted = isGroup && emails.length > 0;
    const head = `${photoCount} photo${photoCount > 1 ? "s" : ""} déposée${photoCount > 1 ? "s" : ""}.`;
    const tail = pasted
      ? scheduled
        ? `Le lien partira à ${clientCount(emails.length)} dès la fin de l'envoi.`
        : `Le lien partira à ${clientCount(emails.length)} avec la publication.`
      : scheduled
        ? isGroup
          ? "La galerie sera publiée dès la fin de l'envoi."
          : "Vos clients les recevront dès la fin de l'envoi."
        : needsClients
          ? "Ajoutez au moins un client pour les envoyer."
          : isGroup
            ? "Vos clients les retrouveront par créneau."
            : `Vos ${clients.length} client${clients.length > 1 ? "s" : ""} les recevront toutes.`;
    bar = (
      <div className={styles.sdBar}>
        <div className={styles.sdBarIn}>
          <span className={styles.sdBarText}>
            <b>{head}</b> <span>{tail}</span>
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
              <button type="button" className={`${styles.sBtn} ${styles.sBtnPri}`} onClick={() => setConfirmPublishOpen(true)}>
                {isGroup ? (
                  pasted ? (
                    <>
                      <span className={styles.sdBtnLong}>Publier et envoyer à {clientCount(emails.length)}</span>
                      <span className={styles.sdBtnShort}>Publier et envoyer ({emails.length})</span>
                    </>
                  ) : (
                    "Publier les photos"
                  )
                ) : (
                  `Envoyer à mes ${clients.length} client${clients.length > 1 ? "s" : ""}`
                )}
              </button>
            )}
          </span>
        </div>
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
          <div className={`${styles.sdShare} ${justPublished ? styles.sdRise : ""}`}>
            <span className={styles.sdQr}>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR code de la galerie" />
              ) : (
                // Le code se dessine côté navigateur : la place est réservée
                // pour que la carte ne saute pas quand il apparaît.
                <span style={{ width: 108, height: 108, display: "grid", placeItems: "center" }}>
                  <Spinner size={22} />
                </span>
              )}
            </span>
            <span className={styles.sdShareMain}>
              <span className={styles.sdOk}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {justPublished ? "Galerie en ligne" : "En ligne"} · {photoCount} photo{photoCount > 1 ? "s" : ""}
              </span>
              <span className={styles.sdShareT}>Le lien de la galerie</span>
              <span className={styles.sdShareH}>Montrez le code au retour, ou envoyez le lien.</span>
              <span className={styles.sdShareRow}>
                <span className={styles.sdShareUrl}>{shareUrl.replace(/^https?:\/\//, "")}</span>
                <button type="button" className={`${styles.sBtn} ${styles.sdChip}`} onClick={() => void copyLink()}>
                  Copier le lien
                </button>
              </span>
            </span>
          </div>
        ) : null}

        {published && isGroup ? emailsSection : null}

        {published ? null : (
          <>
            {empty ? null : inFlight ? (
              <>
                {progressCard}
                {grid}
              </>
            ) : confirmPublishOpen ? (
              paymentsReady ? (
                confirmScreen
              ) : (
                paymentsScreen
              )
            ) : (
              <>
                {failedCard}
                {grid}
              </>
            )}

            <PhotoDropZone sortieId={sortieId} controlRef={dropZone} variant={empty ? "zone" : "silent"} />

            {empty ? (
              <p className={styles.sdNote}>Rien n&rsquo;est visible par vos clients tant que vous n&rsquo;avez pas publié.</p>
            ) : null}
          </>
        )}

        {inFlight || confirmPublishOpen ? null : published ? (
          clients.length > 0 ? (
            <>
              <p className={styles.sDay} style={{ marginTop: 34 }}>
                Vos clients
              </p>
              <div className={`${styles.sdClients} ${justPublished && !isGroup ? styles.sdRise : ""}`}>{clients.map((c) => clientRow(c))}</div>
            </>
          ) : null
        ) : !isGroup ? (
          <div style={{ marginTop: 34 }}>
            <ClientsSection sortieId={sortieId} clients={clients.map((c) => ({ id: c.id, name: c.name, contact: c.contact, sentAt: c.sentAt }))} />
          </div>
        ) : empty ? null : (
          emailsSection
        )}

        {inFlight || confirmPublishOpen ? null : bar}

        {inFlight || confirmPublishOpen ? null : (
          <div className={styles.sDangerZone}>
            {deleteSortieState === "idle" ? (
              <button type="button" className={styles.sDangerLink} onClick={() => setDeleteSortieState("confirm")}>
                Supprimer cette sortie
              </button>
            ) : (
              <div className={styles.sDangerConfirm}>
                <p>
                  Supprimer définitivement cette sortie{photoCount > 0 ? ` (${photoCount} photo${photoCount > 1 ? "s" : ""})` : ""} ?
                  Cette action est irréversible.
                </p>
                <div className={styles.sDangerActions}>
                  <button
                    type="button"
                    className={`${styles.sBtn} ${styles.sBtnGhost}`}
                    onClick={() => setDeleteSortieState("idle")}
                    disabled={deleteSortieState === "deleting"}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className={`${styles.sBtn} ${styles.sBtnDanger}`}
                    onClick={() => void deleteSortie()}
                    disabled={deleteSortieState === "deleting"}
                  >
                    {deleteSortieState === "deleting" ? (
                      <>
                        <Spinner size={16} tone="current" />
                        Suppression…
                      </>
                    ) : (
                      "Supprimer définitivement"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
