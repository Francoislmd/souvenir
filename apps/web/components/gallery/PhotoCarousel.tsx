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

  // Bounce droit → gauche au chargement pour signaler le swipe
  useEffect(() => {
    if (media.length <= 1) return;
    const t1 = setTimeout(() => {
      scrollRef.current?.scrollBy({ left: 60, behavior: "smooth" });
    }, 900);
    const t2 = setTimeout(() => {
      scrollRef.current?.scrollBy({ left: -60, behavior: "smooth" });
    }, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [media.length]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-slide]");
    if (!first) return;
    const step = first.offsetWidth + 8;
    setCurrentIndex(Math.min(Math.round(el.scrollLeft / step), media.length - 1));
  }

  const MAX_DOTS = 10;

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

      {/* Indicateurs */}
      {media.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {media.slice(0, MAX_DOTS).map((_, i) => (
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
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentIndex ? 20 : 6,
                height: 6,
                background: i === currentIndex ? "var(--accent)" : "var(--border-strong)",
              }}
            />
          ))}
          {media.length > MAX_DOTS && (
            <span className="ml-1 text-[11px] tabular-nums text-muted">
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
      className="relative shrink-0 overflow-hidden rounded-3xl bg-canvas"
      style={{
        width: "calc(100% - 28px)",
        aspectRatio: "3 / 4",
        scrollSnapAlign: "start",
        flexShrink: 0,
        boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {item.status !== "READY" ? (
        <div className="flex h-full items-center justify-center text-xs text-muted">
          Traitement en cours…
        </div>
      ) : item.kind === "VIDEO" && item.previewUrl ? (
        <div className={`h-full w-full ${isLocked ? "wm-blurred" : ""}`}>
          <GridVideo previewUrl={item.previewUrl} thumbUrl={item.thumbUrl} />
        </div>
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
        <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 translate-x-px">
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
