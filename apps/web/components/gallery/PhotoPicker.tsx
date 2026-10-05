"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gallery from "@/components/gallery/gallery.module.css";
import styles from "@/components/gallery/sale.module.css";
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
 * La page de vente : la grille, et une jauge à la place des formules.
 * Maquette validée le 03/10/2026 : docs/maquette-page-vente-v2.html.
 *
 * Toucher une photo la choisit. Le total monte à chaque photo et s'arrête au
 * prix de toutes les photos (lib/pricing.ts plafonne déjà) : la jauge rend
 * ce plafond visible, et dit au client ce qu'il lui manque pour tout avoir.
 * Une fois le plafond atteint, les photos restantes sont incluses.
 *
 * Sur ordinateur, la commande reste collée à droite ; sur téléphone, la
 * jauge, le total et le bouton restent en bas de l'écran.
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
  /** Le contexte et le titre, au-dessus de la grille. */
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
      if (e.key === "Escape") setZoom(null);
      if (e.key === "ArrowLeft") setZoom((at - 1 + total) % total);
      if (e.key === "ArrowRight") setZoom((at + 1) % total);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [zoom, total]);

  const price = discount ?? ((cents: number) => cents);
  const n = packOnly ? total : selected.size;
  const allCents = price(quote(total, total, pricing).totalCents);
  const selCents = price(quote(n, total, pricing).totalCents);
  const rawCents = price(n * pricing.pricePhotoCents);
  // Le plafond est atteint : les photos restantes ne coûtent plus rien.
  const capped = n > 0 && n < total && selCents >= allCents;
  const takesAll = n === total || capped;
  const pct = allCents > 0 ? Math.min(100, Math.round((selCents / allCents) * 100)) : 0;
  const unit = formatEuros(price(pricing.pricePhotoCents));
  const countLabel = n === 0 ? "Aucune photo" : n === total ? (total === 1 ? "Votre photo" : `Les ${total} photos`) : `${n} photo${n > 1 ? "s" : ""}`;

  function takeAll(): void {
    setSelected(new Set(allIds));
  }

  const nudge: ReactNode = packOnly ? (
    "Sans filigrane, à télécharger dès le paiement."
  ) : n === 0 ? (
    allCents < total * price(pricing.pricePhotoCents) ? `${unit} la photo. Au-delà de ${formatEuros(allCents)}, les suivantes sont incluses.` : `${unit} la photo.`
  ) : capped ? (
    <>
      Vous avez atteint {formatEuros(allCents)} : les {total - n} autres photos sont incluses.{" "}
      <button type="button" className={styles.lnk} onClick={takeAll}>
        Les ajouter
      </button>
    </>
  ) : n === total ? (
    `Toutes vos photos pour ${formatEuros(allCents)}, et celles ajoutées ensuite.`
  ) : (
    <>
      Encore {formatEuros(allCents - selCents)} et vous avez les {total}.{" "}
      <button type="button" className={styles.lnk} onClick={takeAll}>
        Tout prendre
      </button>
    </>
  );
  const barLine = packOnly
    ? countLabel
    : n === 0
      ? `${unit} la photo, ${formatEuros(allCents)} toutes`
      : takesAll
        ? `${countLabel}, prix maximum`
        : `${countLabel} · +${formatEuros(allCents - selCents)} pour tout`;

  function checkout(): void {
    if (n === 0) return;
    // Au plafond, le client paie le prix de toutes les photos : il les reçoit toutes.
    onCheckout(takesAll ? allIds : Array.from(selected));
  }

  const payLabel = n === 0 ? "Choisissez vos photos" : `Payer ${formatEuros(selCents)}`;
  const payButton = (
    <button type="button" className={styles.cta} onClick={checkout} disabled={busy || n === 0} aria-busy={busy || undefined}>
      <span>{payLabel}</span>
      {busy ? (
        <span className={styles.ctaBusy}>
          <Spinner size={18} tone="light" label="Un instant" />
        </span>
      ) : null}
    </button>
  );
  const totalNode = (
    <>
      {rawCents > selCents ? <s>{formatEuros(rawCents)}</s> : null}
      {formatEuros(selCents)}
    </>
  );

  const zoomed = zoom !== null ? photos[zoom] : undefined;
  const zoomedOn = zoomed ? selected.has(zoomed.id) : false;
  function step(delta: number): void {
    setZoom((at) => (at === null ? at : (at + delta + total) % total));
  }
  const swipeFrom = useRef<{ x: number; y: number } | null>(null);

  return (
    <>
      <div className={styles.main}>
        <div>
          {head}
          <div className={styles.sub}>
            <span>{packOnly ? "Toutes vos photos, en une fois" : n === 0 ? "Touchez celles que vous voulez" : `${n} sur ${total} choisie${n > 1 ? "s" : ""}`}</span>
            {packOnly || total < 2 ? null : (
              <button type="button" className={styles.lnk} onClick={() => setSelected(n === total ? new Set() : new Set(allIds))}>
                {n === total ? "Tout enlever" : "Tout prendre"}
              </button>
            )}
          </div>
          <div className={styles.grid}>
            {photos.map((photo, i) => {
              const on = !packOnly && selected.has(photo.id);
              const big = i === 0 && total >= 3;
              return (
                <div
                  key={photo.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={packOnly ? undefined : on}
                  aria-label={packOnly ? "Voir en grand" : `${photo.isVideo ? "Vidéo" : "Photo"}${photo.timeLabel ? ` de ${photo.timeLabel}` : ""}`}
                  className={`${styles.tile} ${big ? styles.big : ""} ${on ? styles.on : ""}`}
                  onClick={() => (packOnly ? setZoom(i) : toggle(photo.id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (packOnly) setZoom(i);
                      else toggle(photo.id);
                    }
                  }}
                >
                  {photo.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.previewUrl} alt="" loading={i < 4 ? "eager" : "lazy"} decoding="async" />
                  ) : (
                    <TileSpinner />
                  )}
                  {photo.isVideo ? <VideoBadge durationSec={photo.durationSec} /> : null}
                  {photo.timeLabel ? <span className={styles.time}>{photo.timeLabel}</span> : null}
                  {packOnly ? null : (
                    <span className={styles.check} aria-hidden="true">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="Voir en grand"
                    className={styles.zoom}
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoom(i);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <aside className={styles.side}>
          <div className={styles.panel}>
            <div className={`${styles.row} ${styles.display}`}>
              <span>{countLabel}</span>
              <b>{totalNode}</b>
            </div>
            {packOnly ? null : (
              <>
                <div className={styles.gauge} aria-hidden="true">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <div className={styles.legend}>
                  <span>0 €</span>
                  <span>Toutes : {formatEuros(allCents)}</span>
                </div>
              </>
            )}
            <p className={styles.nudge}>{nudge}</p>
            {error ? <p className={styles.error}>{error}</p> : null}
            {payButton}
            <p className={styles.safe}>Apple Pay, Google Pay ou carte bancaire. Paiement sécurisé par Stripe.</p>
          </div>
        </aside>
      </div>

      {after}

      <div className={styles.bar}>
        {packOnly ? null : (
          <div className={styles.gauge} aria-hidden="true">
            <i style={{ width: `${pct}%` }} />
          </div>
        )}
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.barIn}>
          <div className={styles.barText}>
            <span>{barLine}</span>
            <b className={styles.display}>{formatEuros(selCents)}</b>
          </div>
          {payButton}
        </div>
      </div>

      {zoomed ? (
        <div className={gallery.box}>
          <div className={gallery.boxTop}>
            <span className={gallery.boxCount}>
              {zoom! + 1} sur {total}
            </span>
            <button type="button" className={gallery.boxClose} aria-label="Fermer" onClick={() => setZoom(null)}>
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
