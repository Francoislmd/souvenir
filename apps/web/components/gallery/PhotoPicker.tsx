"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "@/components/gallery/gallery.module.css";
import { quote, type PricingConfig } from "@/lib/pricing";
import { formatEuros } from "@/lib/format";

export interface PickerPhoto {
  id: string;
  previewUrl: string | null;
}

/**
 * L'écran d'achat, commun à la boutique individuelle et à la galerie de
 * groupe : une grille, une barre, un bouton. C'est littéralement le même
 * écran des deux côtés, d'où un seul composant.
 *
 * Trois règles tiennent tout le reste :
 *
 * 1. Un seul geste sur une vignette — toucher choisit. Le bouton
 *    « agrandir » posé dans le coin de chaque photo (deux actions sur le
 *    même objet, à viser au pouce) n'apparaît plus qu'au survol, donc
 *    jamais sur un écran tactile.
 * 2. Le bouton n'est jamais désactivé et le prix est toujours écrit. Sans
 *    rien choisir, la barre propose déjà ce que presque tout le monde
 *    prend : tout.
 * 3. Pas de choix de formule. C'était une fausse question : le moteur de
 *    prix plafonne déjà le total au prix du lot, donc prendre les douze
 *    photos une par une coûtait exactement le prix du lot.
 */
export function PhotoPicker({
  photos,
  pricing,
  packOnly,
  allLabel,
  unitSuffix,
  error,
  busy,
  discount,
  onCheckout,
  onSelectionChange,
}: {
  photos: PickerPhoto[];
  pricing: PricingConfig;
  packOnly: boolean;
  /** « Les 12 photos » côté individuel, « Les 34 photos du créneau » côté groupe. */
  allLabel: (count: number) => string;
  /** Ce qui suit le prix unitaire dans la barre, ex. « l'unité ». */
  unitSuffix: string;
  error: string | null;
  busy: boolean;
  /** Remise en cours (offre à durée limitée) — appliquée à l'affichage comme au débit. */
  discount?: (cents: number) => number;
  onCheckout: (photoIds: string[]) => void;
  onSelectionChange?: (added: string[], removed: string[], source: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState<number | null>(null);
  const zoomRef = useRef<number | null>(null);
  zoomRef.current = zoom;

  const total = photos.length;
  const allIds = photos.map((p) => p.id);

  // Vente au lot uniquement (Réglages) : la sélection n'a pas de sens, elle
  // reste pleine et les vignettes ne réagissent pas.
  useEffect(() => {
    if (packOnly) setSelected(new Set(allIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packOnly, total]);

  const apply = useCallback(
    (next: Set<string>, source: string) => {
      setSelected((prev) => {
        onSelectionChange?.(
          Array.from(next).filter((id) => !prev.has(id)),
          Array.from(prev).filter((id) => !next.has(id)),
          source,
        );
        return next;
      });
    },
    [onSelectionChange],
  );

  function toggle(id: string): void {
    if (packOnly) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    apply(next, "tile");
  }

  // Navigation clavier de la vue plein écran (ordinateur) — ignorée si le
  // focus est dans un champ de saisie, pour ne pas voler les flèches à
  // l'email du paiement.
  useEffect(() => {
    if (zoom === null) return;
    function onKeyDown(e: KeyboardEvent): void {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
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
  const selectedCents = price(quote(selected.size, total, pricing).totalCents);
  const allCents = price(quote(total, total, pricing).totalCents);
  const extraCents = allCents - selectedCents;
  const partial = selected.size > 0 && selected.size < total;

  const barLabel = selected.size === 0 || selected.size === total ? allLabel(total) : `${selected.size} photo${selected.size > 1 ? "s" : ""} choisie${selected.size > 1 ? "s" : ""}`;
  const ctaLabel = partial
    ? `Prendre ${selected.size === 1 ? "cette photo" : `ces ${selected.size} photos`} · ${formatEuros(selectedCents)}`
    : `Tout prendre · ${formatEuros(allCents)}`;

  function checkout(): void {
    onCheckout(partial ? Array.from(selected) : allIds);
  }

  const zoomed = zoom !== null ? photos[zoom] : undefined;
  const zoomedOn = zoomed ? selected.has(zoomed.id) : false;

  return (
    <>
      <div className={styles.grid}>
        {photos.map((photo, i) => {
          const on = selected.has(photo.id);
          return (
            // Une div plutôt qu'un bouton : le « voir en grand » est un vrai
            // bouton, et un bouton dans un bouton n'est pas du HTML valide.
            <div
              key={photo.id}
              role={packOnly ? undefined : "button"}
              tabIndex={packOnly ? undefined : 0}
              aria-pressed={packOnly ? undefined : on}
              className={`${styles.tile} ${on ? styles.tileOn : ""}`}
              onClick={() => toggle(photo.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(photo.id);
                }
              }}
            >
              {photo.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.previewUrl} alt="" />
              ) : null}
              <span className={styles.check} aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <button
                type="button"
                tabIndex={-1}
                aria-label="Voir en grand"
                className={styles.zoom}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(i);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                  <path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.bar}>
        <div className={styles.barIn}>
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.barRow}>
            <span className={styles.barText}>
              <span className={styles.barLabel}>{barLabel}</span>
              <span className={styles.barSub}>
                {partial && extraCents > 0
                  ? `${allLabel(total)} pour ${formatEuros(allCents)}, soit ${formatEuros(extraCents)} de plus`
                  : `${formatEuros(pricing.pricePhotoCents)} ${unitSuffix}`}
              </span>
            </span>
            {packOnly ? null : selected.size > 0 ? (
              <button type="button" className={styles.clear} onClick={() => apply(new Set(), "clear")}>
                Tout enlever
              </button>
            ) : (
              <span className={styles.barSide}>
                {formatEuros(pricing.pricePhotoCents)} {unitSuffix}
              </span>
            )}
          </div>
          <button type="button" className={styles.cta} onClick={checkout} disabled={busy || total === 0}>
            {busy ? "Un instant…" : ctaLabel}
          </button>
          {partial && extraCents > 0 ? (
            <p className={styles.more}>
              <button type="button" className={styles.moreBtn} onClick={() => apply(new Set(allIds), "take_all")}>
                {allLabel(total)} pour <b>{formatEuros(allCents)}</b>
              </button>
              , soit {formatEuros(extraCents)} de plus
            </p>
          ) : null}
        </div>
      </div>

      {zoomed ? (
        <div className={styles.box}>
          <div className={styles.boxTop}>
            <span className={styles.boxCount}>
              {zoom! + 1} sur {total}
            </span>
            <button type="button" className={styles.boxClose} aria-label="Fermer" onClick={() => setZoom(null)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className={styles.boxPh}>
            {zoomed.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={zoomed.previewUrl} alt="" />
            ) : null}
          </div>
          <div className={styles.boxFoot}>
            {packOnly ? null : (
              <button type="button" className={styles.cta} onClick={() => toggle(zoomed.id)}>
                {zoomedOn ? (
                  "Retirer cette photo"
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Choisir cette photo · {formatEuros(pricing.pricePhotoCents)}
                  </>
                )}
              </button>
            )}
            <p className={styles.boxNote}>Le filigrane disparaît après le paiement.</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
