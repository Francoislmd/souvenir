"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gallery from "@/components/gallery/gallery.module.css";
import styles from "@/components/gallery/sale.module.css";
import v from "@/components/gallery/vente.module.css";
import { quote, type PricingConfig } from "@/lib/pricing";

/** « 6,00 € » : la page de vente affiche les centimes, comme la maquette. */
const eur2 = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

type Formula = "unit" | "all";

/**
 * La page de vente (canvas « Page de vente, design system Corail »,
 * 28/10/2026) : un diaporama, une bande de vignettes, et à droite le choix
 * de la formule puis le récapitulatif. Remplace la grille du 22/10.
 *
 * Toucher la photo affichée la choisit (formule à l'unité) ; le bouton en
 * haut à gauche l'ouvre en grand. En mode pack seul, rien à choisir :
 * toucher la photo l'ouvre. Le total s'arrête au prix de toutes les photos
 * (lib/pricing.ts plafonne déjà).
 *
 * Aucun texte sur la photo : le filigrane est dans les pixels de l'aperçu,
 * le reste vit sous l'image ou dans le panneau.
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
  /** Le titre, au-dessus du diaporama. */
  head: ReactNode;
  /** Les questions et le pied de page, sous la page. */
  after?: ReactNode;
  onCheckout: (photoIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cur, setCur] = useState(0);
  const [formula, setFormula] = useState<Formula>(packOnly ? "all" : "unit");
  const [zoom, setZoom] = useState<number | null>(null);
  const zoomRef = useRef<number | null>(null);
  zoomRef.current = zoom;
  const stripRef = useRef<HTMLDivElement>(null);
  const swipeFrom = useRef<{ x: number; y: number } | null>(null);

  const total = photos.length;
  const allIds = photos.map((p) => p.id);
  const at = total > 0 ? Math.min(cur, total - 1) : 0;
  const current = photos[at];

  function go(i: number): void {
    if (total === 0) return;
    setCur((i + total) % total);
  }

  function toggle(id: string): void {
    if (packOnly) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    // Choisir une photo, c'est choisir la formule à l'unité.
    setFormula("unit");
  }

  // La vignette en cours reste visible dans la bande, sans faire sauter la page.
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[at] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const left = thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [at]);

  useEffect(() => {
    if (zoom === null) return;
    function onKeyDown(e: KeyboardEvent): void {
      const z = zoomRef.current;
      if (z === null) return;
      if (e.key === "Escape") closeZoom();
      if (e.key === "ArrowLeft") setZoom((z - 1 + total) % total);
      if (e.key === "ArrowRight") setZoom((z + 1) % total);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [zoom, total]);

  function closeZoom(): void {
    // On revient dans le diaporama sur la photo qu'on regardait.
    if (zoomRef.current !== null) setCur(zoomRef.current);
    setZoom(null);
  }

  const price = discount ?? ((cents: number) => cents);
  const n = selected.size;
  const all = packOnly || formula === "all";
  const allCents = price(quote(total, total, pricing).totalCents);
  const selCents = price(quote(n, total, pricing).totalCents);
  const unitCents = price(pricing.pricePhotoCents);
  // Le plafond est atteint : les photos restantes ne coûtent plus rien.
  const capped = !all && n > 0 && n < total && selCents >= allCents;
  const takesAll = all || n === total || capped;
  const off = !all && n === 0;
  const allLabel = total === 1 ? "Votre photo" : `Les ${total} photos`;
  const recapLabel = all || capped ? allLabel : `${n} photo${n > 1 ? "s" : ""}`;
  const recapPrice = eur2(all ? allCents : selCents);

  function pay(): void {
    if (off) return;
    // Au plafond, le client paie le prix de toutes les photos : il les reçoit toutes.
    onCheckout(takesAll ? allIds : Array.from(selected));
  }

  const payButton = (extra: string) => (
    <button type="button" className={`${styles.cta} ${extra}`} onClick={pay} disabled={busy || total === 0 || off} aria-busy={busy || undefined}>
      <span>Commander</span>
      {busy ? (
        <span className={styles.ctaBusy}>
          <Spinner size={18} tone="light" label="Un instant" />
        </span>
      ) : null}
    </button>
  );

  const formulas: { id: Formula; name: string; sub: string; cents: number }[] = [
    ...(packOnly ? [] : [{ id: "unit" as const, name: "À l’unité", sub: "Téléchargement HD", cents: unitCents }]),
    { id: "all", name: total === 1 ? "Votre photo" : "Toutes les photos", sub: total === 1 ? "En HD" : `Les ${total} photos en HD`, cents: allCents },
  ];

  const zoomed = zoom !== null ? photos[zoom] : undefined;
  const zoomedOn = zoomed ? selected.has(zoomed.id) : false;
  function step(delta: number): void {
    setZoom((z) => (z === null ? z : (z + delta + total) % total));
  }
  const kindOf = (p: PickerPhoto) => (p.isVideo ? "la vidéo" : "la photo");

  return (
    <>
      <div className={v.wrap}>
        {head}
        <div className={v.layout}>
          <div className={v.show}>
            {/* Le diaporama : une photo à la fois, pleine largeur. */}
            <div
              className={v.stage}
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
                if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(t.clientY - from.y)) return;
                go(at + (dx < 0 ? 1 : -1));
              }}
            >
              <div className={v.track} style={{ transform: `translateX(calc(${-at} * (100% + 10px)))` }}>
                {photos.map((photo, i) => {
                  const on = !packOnly && selected.has(photo.id);
                  // Seules la photo affichée et ses voisines chargent leur image.
                  const near = Math.abs(i - at) <= 1 || (at === 0 && i === total - 1) || (at === total - 1 && i === 0);
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      className={`${v.slide} ${on ? v.slideOn : ""}`}
                      tabIndex={i === at ? 0 : -1}
                      aria-hidden={i === at ? undefined : true}
                      aria-pressed={packOnly || i !== at ? undefined : on}
                      aria-label={
                        packOnly
                          ? `Voir ${kindOf(photo)} ${i + 1} en grand`
                          : `${on ? "Retirer" : "Choisir"} ${kindOf(photo)} ${i + 1} sur ${total}${photo.timeLabel ? `, ${photo.timeLabel}` : ""}`
                      }
                      onClick={() => (i !== at ? go(i) : packOnly ? setZoom(i) : toggle(photo.id))}
                    >
                      {photo.previewUrl && near ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo.previewUrl} alt="" decoding="async" draggable={false} />
                      ) : !photo.previewUrl ? (
                        <TileSpinner />
                      ) : null}
                      {photo.isVideo ? <PlayMark /> : photo.previewUrl ? <LockBadge /> : null}
                    </button>
                  );
                })}
              </div>
              {current?.isVideo ? <VideoBadge durationSec={current.durationSec} /> : null}
              {current ? (
                <button type="button" className={`${v.round} ${v.zoomBtn}`} aria-label={`Voir ${kindOf(current)} en grand`} onClick={() => setZoom(at)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 4h5v5M9 20H4v-5M20 4l-6 6M4 20l6-6" />
                  </svg>
                </button>
              ) : null}
              {total > 1 ? (
                <>
                  <button type="button" className={`${v.round} ${v.prev}`} aria-label="Photo précédente" onClick={() => go(at - 1)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m15 6-6 6 6 6" />
                    </svg>
                  </button>
                  <button type="button" className={`${v.round} ${v.next}`} aria-label="Photo suivante" onClick={() => go(at + 1)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </button>
                </>
              ) : null}
            </div>

            {/* Les vignettes : où j'en suis, ce que j'ai pris. */}
            {total > 1 ? (
              <div className={v.thumbs} ref={stripRef}>
                {photos.map((photo, i) => {
                  const on = !packOnly && selected.has(photo.id);
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      className={`${v.thumb} ${i === at ? v.thumbCur : ""} ${on ? v.thumbOn : ""}`}
                      aria-label={`${photo.isVideo ? "Vidéo" : "Photo"} ${i + 1}${on ? ", choisie" : ""}`}
                      aria-current={i === at ? "true" : undefined}
                      onClick={() => go(i)}
                    >
                      {photo.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo.previewUrl} alt="" loading={i < 8 ? "eager" : "lazy"} decoding="async" draggable={false} />
                      ) : null}
                      {on ? (
                        <span className={v.thumbCheck} aria-hidden="true">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Une seule carte : la formule en deux lignes à cocher, le total,
              le bouton. Pas de titre, pas de cartes empilées (28/10/2026). */}
          <aside className={v.panel} aria-label="Paiement">
            <div className={v.formulas} role="radiogroup" aria-label="Formule">
              {formulas.map((f) => {
                const on = f.id === "all" ? all : !all;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`${v.formula} ${on ? v.formulaOn : ""}`}
                    onClick={() => setFormula(f.id)}
                  >
                    <span className={v.radio} aria-hidden="true" />
                    <span className={v.formulaText}>
                      <span className={v.formulaName}>{f.name}</span>
                      <span className={v.formulaSub}>{f.sub}</span>
                    </span>
                    <span className={v.formulaPrice}>{eur2(f.cents)}</span>
                  </button>
                );
              })}
            </div>
            <div className={v.total}>
              <span>{recapLabel}</span>
              <strong>{recapPrice}</strong>
            </div>
            {capped ? <p className={v.hint}>Prix plafonné&nbsp;: toutes les photos sont incluses.</p> : null}
            {error ? <p className={styles.error}>{error}</p> : null}
            {payButton(v.panelCta)}
            <p className={v.safe}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2.5" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Carte, Apple Pay ou Google Pay
            </p>
          </aside>
        </div>
      </div>

      {after}

      <div className={v.bar}>
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={v.barIn}>
          <div className={v.barText}>
            <span>{recapLabel}</span>
            <b>{recapPrice}</b>
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
                    {zoomed.isVideo ? "Choisir cette vidéo" : "Choisir cette photo"} · {eur2(unitCents)}
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
 * Le cadenas de l'aperçu payant, posé au centre de la photo. Pastille encre,
 * filet blanc, cadenas au trait : même dessin que le badge de l'e-mail.
 */
function LockBadge() {
  return (
    <svg className={v.lock} viewBox="-56 -56 112 112" aria-hidden="true">
      <circle r="55.5" fill="rgba(42, 16, 34, 0.55)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
      <g transform="translate(0 2)" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="-17" y="-4" width="34" height="24" rx="5" />
        <path d="M-10-4v-10a10 10 0 0 1 20 0v10" />
      </g>
    </svg>
  );
}
