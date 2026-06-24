"use client";

import { useEffect, useRef, useState } from "react";
import type { GalleryMedia } from "./MediaTile";
import { GridVideo } from "./GridVideo";

export function PhotoCarousel({
  media,
  locked,
  onOpen,
}: {
  media: GalleryMedia[];
  locked: boolean;
  onOpen: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(media.length > 1);

  // Bounce right → gauche pour signaler qu'on peut swiper
  useEffect(() => {
    if (media.length <= 1) return;
    const t1 = setTimeout(() => {
      scrollRef.current?.scrollBy({ left: 64, behavior: "smooth" });
    }, 900);
    const t2 = setTimeout(() => {
      scrollRef.current?.scrollBy({ left: -64, behavior: "smooth" });
    }, 1600);
    const t3 = setTimeout(() => setHintVisible(false), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [media.length]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-slide]");
    if (!first) return;
    const step = first.offsetWidth + 8; // largeur slide + gap-2
    setCurrentIndex(Math.min(Math.round(el.scrollLeft / step), media.length - 1));
  }

  const MAX_DOTS = 9;
  const dots = media.slice(0, MAX_DOTS);

  return (
    <div className="select-none">
      {/* Slides */}
      <div className="overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2"
          style={{
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          } as React.CSSProperties}
        >
          {media.map((item, i) => (
            <Slide
              key={item.id}
              item={item}
              locked={locked}
              priority={i === 0}
              onClick={() => onOpen(i)}
            />
          ))}
        </div>
      </div>

      {/* Swipe hint — visible seulement au chargement */}
      <div
        className={`mt-3 flex justify-center transition-opacity duration-500 ${
          hintVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-ink/75 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          <SwipeArrow />
          Glisse pour voir la suite
        </span>
      </div>

      {/* Dots de navigation */}
      {media.length > 1 && (
        <div
          className={`flex justify-center gap-1.5 transition-opacity duration-500 ${
            hintVisible ? "mt-1.5 opacity-0" : "mt-3 opacity-100"
          }`}
        >
          {dots.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Photo ${i + 1}`}
              onClick={() => {
                const el = scrollRef.current;
                const first = el?.querySelector<HTMLElement>("[data-slide]");
                if (!el || !first) return;
                el.scrollTo({ left: i * (first.offsetWidth + 8), behavior: "smooth" });
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-6 bg-ink"
                  : "w-1.5 bg-border-strong"
              }`}
            />
          ))}
          {media.length > MAX_DOTS && (
            <span className="ml-1 text-xs tabular-nums text-muted">
              {currentIndex + 1}/{media.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Slide individuelle ── */
function Slide({
  item,
  locked,
  priority,
  onClick,
}: {
  item: GalleryMedia;
  locked: boolean;
  priority: boolean;
  onClick: () => void;
}) {
  const isLocked = locked && item.status === "READY";

  return (
    <button
      data-slide
      type="button"
      onClick={onClick}
      disabled={item.status !== "READY"}
      onContextMenu={(e) => e.preventDefault()}
      className="relative shrink-0 overflow-hidden rounded-2xl bg-canvas"
      style={{
        width: "calc(100vw - 48px)",
        aspectRatio: "4 / 5",
        scrollSnapAlign: "start",
      }}
    >
      {item.status !== "READY" ? (
        <div className="flex h-full items-center justify-center text-xs text-muted">
          Traitement en cours…
        </div>
      ) : item.kind === "VIDEO" && item.previewUrl ? (
        <GridVideo previewUrl={item.previewUrl} thumbUrl={item.thumbUrl} />
      ) : item.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.previewUrl}
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          className={`media-protected h-full w-full object-cover ${isLocked ? "wm-blurred" : ""}`}
        />
      ) : null}

      {/* Badge vidéo */}
      {item.kind === "VIDEO" && item.status === "READY" && (
        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M8 5v14l11-7-11-7Z" />
          </svg>
        </span>
      )}

      {/* Verrou */}
      {isLocked && (
        <div className="wm">
          <div className="wm-lock">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
}

/* ── Icône swipe animée ── */
function SwipeArrow() {
  return (
    <svg
      viewBox="0 0 28 14"
      fill="none"
      className="h-3.5 w-7 animate-[swipe-arrow_1.2s_ease-in-out_infinite]"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 7h26M20 1l6 6-6 6" />
    </svg>
  );
}
