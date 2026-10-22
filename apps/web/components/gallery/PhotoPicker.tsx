"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gallery from "@/components/gallery/gallery.module.css";
import styles from "@/components/gallery/sale.module.css";
import v from "@/components/gallery/vente.module.css";
import { quote, type PricingConfig } from "@/lib/pricing";
import { formatEuros } from "@/lib/format";
import { Spinner, TileSpinner } from "@/components/ui/Spinner";
import { PlayMark, VideoBadge } from "@/components/ui/VideoBadge";
import { formatDuration } from "@/lib/media";

export interface PickerPhoto {
  id: string;
  previewUrl: string | null;
  /** Vidéo : l'aperçu est sa vignette filigranée, la vidéo se regarde après achat. */
  isVideo?: boolean;
  durationSec?: number | null;
  /** « 10 h 14 » */
  timeLabel?: string | null;
}

/**
 * La page de vente (canvas « Page de vente, design system », 22/10/2026) :
 * le titre, une grille de photos, et le paiement. Remplace le diaporama.
 *
 * Toucher une photo la choisit ; la loupe l'ouvre en grand. En mode pack
 * seul, il n'y a rien à choisir : toucher une photo l'ouvre.
 * Le total monte à chaque photo et s'arrête au prix de toutes les photos
 * (lib/pricing.ts plafonne déjà) : la jauge rend ce plafond visible.
 *
 * Sur ordinateur, le panneau de paiement reste collé à droite de la
 * grille ; sur téléphone, une barre réduite reste en bas de l'écran.
 */
export function PhotoPicker({
  photos,
  pricing,
  packOnly,
  error,
  busy,
  discount,
  head,
  after,
  onCheckout,
}: {
  photos: PickerPhoto[];
  pricing: PricingConfig;
  packOnly: boolean;
  error: string | null;
  busy: boolean;
  /** Remise en cours (offre à durée limitée), appliquée à l'affichage comme au débit. */
  discount?: (cents: number) => number;
  /** Le titre, au-dessus de la grille. */
  head: ReactNode;
  /** Les questions et le pied de page, sous la grille. */
  after?: ReactNode;
  onCheckout: (photoIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState<number | null>(null);
  const zoomRef = useRef<number | null>(null);
  zoomRef.current = zoom;

  const total = photos.length;
  const allIds = photos.map((p) => p.id);

  function toggle(id: string): void {
    if (packOnly) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  useEffect(() => {
    if (zoom === null) return;
    function onKeyDown(e: KeyboardEvent): void {
      const at = zoomRef.current;
      if (at === null) return;
      if (e.key === "Escape") closeZoom();
      if (e.key === "ArrowLeft") setZoom((at - 1 + total) % total);
      if (e.key === "ArrowRight") setZoom((at + 1) % total);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [zoom, total]);

  function closeZoom(): void {
    setZoom(null);
  }

  const price = discount ?? ((cents: number) => cents);
  const n = packOnly ? total : selected.size;
  const allCents = price(quote(total, total, pricing).totalCents);
  const selCents = price(quote(n, total, pricing).totalCents);
  // Le plafond est atteint : les photos restantes ne coûtent plus rien.
  const capped = n > 0 && n < total && selCents >= allCents;
  const takesAll = n === total || capped;
  const pct = allCents > 0 ? Math.min(100, Math.round((selCents / allCents) * 100)) : 0;
  const unit = formatEuros(price(pricing.pricePhotoCents));
  const allLabel = total === 1 ? "Votre photo" : `Les ${total} photos`;

  function takeAll(): void {
    setSelected(new Set(allIds));
  }

  const label = packOnly
    ? allLabel
    : n === 0
      ? allLabel
      : takesAll
        ? `${allLabel}, prix maximum`
        : `${n} photo${n > 1 ? "s" : ""} choisie${n > 1 ? "s" : ""}`;
  const shownPrice = formatEuros(n === 0 || packOnly ? allCents : selCents);

  // Une phrase, un seul fait.
  const hint: ReactNode = packOnly ? (
    "Sans filigrane, à télécharger dès le paiement."
  ) : n === 0 ? (
    `Ou touchez une photo pour la choisir, ${unit} pièce.`
  ) : takesAll ? (
    "Toutes les photos sont incluses, et celles ajoutées ensuite."
  ) : (
    <>
      Encore {formatEuros(allCents - selCents)} pour les {total}.{" "}
      <button type="button" className={styles.lnk} onClick={takeAll}>
        Tout prendre
      </button>
    </>
  );

  function pay(): void {
    // Rien de choisi : le bouton vend tout. Au plafond, le client paie le
    // prix de toutes les photos : il les reçoit toutes.
    if (packOnly || n === 0 || takesAll) onCheckout(allIds);
    else onCheckout(Array.from(selected));
  }

  const payLabel = packOnly || n === 0 || takesAll ? `Tout acheter · ${formatEuros(allCents)}` : `Payer ${formatEuros(selCents)}`;
  const payButton = (extra: string) => (
    <button type="button" className={`${styles.cta} ${extra}`} onClick={pay} disabled={busy || total === 0} aria-busy={busy || undefined}>
      <span>{payLabel}</span>
      {busy ? (
        <span className={styles.ctaBusy}>
          <Spinner size={18} tone="light" label="Un instant" />
        </span>
      ) : null}
    </button>
  );

  const zoomed = zoom !== null ? photos[zoom] : undefined;
  const zoomedOn = zoomed ? selected.has(zoomed.id) : false;
  function step(delta: number): void {
    setZoom((at) => (at === null ? at : (at + delta + total) % total));
  }
  const swipeFrom = useRef<{ x: number; y: number } | null>(null);

  return (
    <>
      <div className={v.wrap}>
        {head}
        <div className={v.layout}>
          <div>
            {!packOnly && total > 1 ? (
              <div className={v.headRow}>
                <span>{n === 0 ? "Choisissez vos photos" : `${n} sur ${total} choisie${n > 1 ? "s" : ""}`}</span>
                <button type="button" className={styles.lnk} onClick={() => setSelected(n === total ? new Set() : new Set(allIds))}>
                  {n === total ? "Tout enlever" : "Tout prendre"}
                </button>
              </div>
            ) : null}
            <div className={v.grid}>
              {photos.map((photo, i) => {
                const on = !packOnly && selected.has(photo.id);
                const kind = photo.isVideo ? "la vidéo" : "la photo";
                return (
                  <div key={photo.id} className={`${v.tile} ${on ? v.tileOn : ""}`}>
                    <button
                      type="button"
                      className={v.tileHit}
                      aria-pressed={packOnly ? undefined : on}
                      aria-label={packOnly ? `Voir ${kind} ${i + 1} en grand` : `${on ? "Retirer" : "Choisir"} ${kind} ${i + 1}${photo.timeLabel ? `, ${photo.timeLabel}` : ""}`}
                      onClick={() => (packOnly ? setZoom(i) : toggle(photo.id))}
                    >
                      {photo.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo.previewUrl} alt="" loading={i < 9 ? "eager" : "lazy"} decoding="async" draggable={false} />
                      ) : (
                        <TileSpinner />
                      )}
                      {photo.isVideo ? <PlayMark /> : photo.previewUrl ? <LockBadge /> : null}
                    </button>
                    {photo.isVideo ? <VideoBadge durationSec={photo.durationSec} /> : null}
                    {photo.timeLabel && !photo.isVideo ? <span className={v.time}>{photo.timeLabel}</span> : null}
                    {packOnly ? null : (
                      <span className={v.check} aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                    )}
                    {packOnly ? null : (
                      <button type="button" className={v.zoom} aria-label={`Voir ${kind} ${i + 1} en grand`} onClick={() => setZoom(i)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="11" cy="11" r="6.5" />
                          <path d="m20 20-4.2-4.2" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <aside className={v.panel} aria-label="Paiement">
            <div className={v.panelHead}>
              <span>{label}</span>
              <strong className={v.price}>{shownPrice}</strong>
            </div>
            {packOnly ? null : (
              <div className={v.gauge} aria-hidden="true">
                <i style={{ width: `${n === 0 ? 0 : pct}%` }} />
              </div>
            )}
            <p className={v.hint}>{hint}</p>
            {error ? <p className={styles.error}>{error}</p> : null}
            {payButton(v.panelCta)}
            <p className={v.safe}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2.5" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Carte, Apple Pay, Google Pay
            </p>
          </aside>
        </div>
      </div>

      {after}

      <div className={v.bar}>
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={v.barIn}>
          <div className={v.barText}>
            <span>{label}</span>
            <b>{shownPrice}</b>
          </div>
          {payButton(v.barCta)}
        </div>
      </div>

      {zoomed ? (
        <div className={gallery.box}>
          <div className={gallery.boxTop}>
            <span className={gallery.boxCount}>
              {zoom! + 1} sur {total}
            </span>
            <button type="button" className={gallery.boxClose} aria-label="Fermer" onClick={closeZoom}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div
            className={gallery.boxPh}
            onTouchStart={(e) => {
              const t = e.changedTouches[0];
              swipeFrom.current = t ? { x: t.clientX, y: t.clientY } : null;
            }}
            onTouchEnd={(e) => {
              const from = swipeFrom.current;
              const t = e.changedTouches[0];
              swipeFrom.current = null;
              if (!from || !t) return;
              const dx = t.clientX - from.x;
              // Seuil et comparaison à la verticale : sans ça, un doigt qui
              // descend légèrement de travers changerait de photo.
              if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(t.clientY - from.y)) return;
              step(dx < 0 ? 1 : -1);
            }}
          >
            {zoomed.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={zoomed.previewUrl} alt="" />
            ) : (
              <TileSpinner tone="light" size={30} />
            )}
            {zoomed.isVideo ? (
              <>
                <PlayMark />
                <VideoBadge durationSec={zoomed.durationSec} />
              </>
            ) : null}

            {total > 1 ? (
              <>
                <button type="button" className={`${gallery.boxNav} ${gallery.boxPrev}`} aria-label="Photo précédente" onClick={() => step(-1)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 5 8 12l6.5 7" />
                  </svg>
                </button>
                <button type="button" className={`${gallery.boxNav} ${gallery.boxNext}`} aria-label="Photo suivante" onClick={() => step(1)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.5 5 16 12l-6.5 7" />
                  </svg>
                </button>
              </>
            ) : null}
          </div>
          <div className={gallery.boxFoot}>
            {packOnly ? null : (
              <button type="button" className={gallery.cta} onClick={() => toggle(zoomed.id)}>
                {zoomedOn ? (
                  zoomed.isVideo ? "Retirer cette vidéo" : "Retirer cette photo"
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {zoomed.isVideo ? "Choisir cette vidéo" : "Choisir cette photo"} · {formatEuros(pricing.pricePhotoCents)}
                  </>
                )}
              </button>
            )}
            <p className={gallery.boxNote}>
              {zoomed.isVideo
                ? `Vidéo${formatDuration(zoomed.durationSec) ? ` de ${formatDuration(zoomed.durationSec)}` : ""}, à regarder en entier et sans filigrane après le paiement.`
                : "Le filigrane disparaît après le paiement."}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * Le cadenas de l'aperçu payant. Il était dessiné dans l'image
 * (lib/group-watermark.ts) et grossissait donc avec la vignette. Posé ici,
 * il a la même taille partout. Pastille encre, filet blanc, cadenas au trait.
 */
function LockBadge() {
  return (
    <svg className={v.tileLock} viewBox="-56 -56 112 112" aria-hidden="true">
      <circle r="55.5" fill="rgba(20, 19, 32, 0.55)" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
      <g transform="translate(0 2)" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="-17" y="-4" width="34" height="24" rx="5" />
        <path d="M-10-4v-10a10 10 0 0 1 20 0v10" />
      </g>
    </svg>
  );
}
