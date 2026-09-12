"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/components/gallery/gallery.module.css";
import { quote, type PricingConfig } from "@/lib/pricing";
import { formatEuros } from "@/lib/format";
import { Spinner, TileSpinner } from "@/components/ui/Spinner";

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

  function toggle(id: string): void {
    if (packOnly) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
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

  // Le même chemin pour les trois gestes : les touches du clavier, les
  // flèches posées sur la photo et le glissement au doigt. La visionneuse
  // boucle — arriver au bout d'un créneau de sept photos et se retrouver
  // bloqué sur un bouton mort n'aide personne.
  function step(delta: number): void {
    setZoom((at) => (at === null ? at : (at + delta + total) % total));
  }

  const swipeFrom = useRef<{ x: number; y: number } | null>(null);

  // Sur téléphone, la grille devient un rail : une photo à la fois, calée au
  // doigt (scroll-snap, feuille de style). Le pas se mesure sur la vignette
  // elle-même plutôt que de recopier les valeurs du CSS : sa largeur tient à
  // un pourcentage, et la retoucher ne doit pas décaler le repère.
  const [at, setAt] = useState(0);
  function onRailScroll(e: React.UIEvent<HTMLDivElement>): void {
    const rail = e.currentTarget;
    if (rail.scrollWidth <= rail.clientWidth) return; // grille : rien à suivre
    const first = rail.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 0;
    const step = first ? first.offsetWidth + gap : rail.clientWidth;
    if (step <= 0) return;
    setAt(Math.min(total - 1, Math.max(0, Math.round(rail.scrollLeft / step))));
  }

  return (
    <>
      <div className={styles.grid} onScroll={onRailScroll}>
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
                <img src={photo.previewUrl} alt="" loading={i < 2 ? "eager" : "lazy"} decoding="async" />
              ) : (
                // L'aperçu n'est pas encore prêt : le worker traite encore
                // cette photo, elle arrivera d'elle-même. Une tuile grise et
                // muette passait pour une photo manquante.
                <TileSpinner />
              )}
              <span className={styles.check} aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <button
                type="button"
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

      {/* Où l'on en est dans le rail. Masqué sur ordinateur, où la grille
          montre tout d'un coup. Au-delà de huit photos, une rangée de points
          n'est plus lisible ni cliquable : le compte prend le relais. */}
      {total > 1 ? (
        <div className={styles.railPos} aria-hidden="true">
          {total <= 8 ? (
            <div className={styles.dots}>
              {photos.map((photo, i) => (
                <i key={photo.id} className={i === at ? styles.dotOn : undefined} />
              ))}
            </div>
          ) : (
            <p className={styles.count}>
              {at + 1} sur {total}
            </p>
          )}
        </div>
      ) : null}

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
              <button type="button" className={styles.clear} onClick={() => setSelected(new Set())}>
                Tout enlever
              </button>
            ) : (
              <span className={styles.barSide}>
                {formatEuros(pricing.pricePhotoCents)} {unitSuffix}
              </span>
            )}
          </div>
          <button type="button" className={styles.cta} onClick={checkout} disabled={busy || total === 0}>
            {busy ? (
              <>
                <Spinner size={17} tone="light" />
                Un instant…
              </>
            ) : (
              ctaLabel
            )}
          </button>
          {partial && extraCents > 0 ? (
            <p className={styles.more}>
              <button type="button" className={styles.moreBtn} onClick={() => setSelected(new Set(allIds))}>
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
          <div
            className={styles.boxPh}
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

            {total > 1 ? (
              <>
                <button type="button" className={`${styles.boxNav} ${styles.boxPrev}`} aria-label="Photo précédente" onClick={() => step(-1)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 5 8 12l6.5 7" />
                  </svg>
                </button>
                <button type="button" className={`${styles.boxNav} ${styles.boxNext}`} aria-label="Photo suivante" onClick={() => step(1)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.5 5 16 12l-6.5 7" />
                  </svg>
                </button>
              </>
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
