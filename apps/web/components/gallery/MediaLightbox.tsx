"use client";

import { useRef, useState } from "react";
import type { GalleryMedia } from "./MediaTile";

export function MediaLightbox({
  media,
  token,
  locked,
  initialIndex,
  onClose,
}: {
  media: GalleryMedia[];
  token: string;
  locked: boolean;
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const trackedRef = useRef<Set<string>>(new Set());

  const item = media[index];
  const isLocked = locked && item.status === "READY";

  function goTo(next: number): void {
    setIndex(Math.min(Math.max(next, 0), media.length - 1));
  }

  function handleTouchStart(event: React.TouchEvent): void {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: React.TouchEvent): void {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < 40) return;
    goTo(deltaX > 0 ? index - 1 : index + 1);
  }

  function handlePlay(mediaId: string): void {
    if (trackedRef.current.has(mediaId)) return;
    trackedRef.current.add(mediaId);
    void fetch(`/api/gallery/${token}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "preview_played", meta: { mediaId } }),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
          {index + 1} / {media.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(event) => event.preventDefault()}
      >
        {item.status !== "READY" ? (
          <p className="text-sm text-white/70">Traitement en cours…</p>
        ) : item.kind === "VIDEO" && item.previewUrl ? (
          <video
            key={item.id}
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            playsInline
            preload="metadata"
            poster={item.thumbUrl ?? undefined}
            onPlay={() => handlePlay(item.id)}
            onContextMenu={(event) => event.preventDefault()}
            className="media-protected h-full max-h-full w-full object-contain"
          >
            <source src={item.previewUrl} />
          </video>
        ) : item.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.id}
            src={item.previewUrl}
            alt=""
            draggable={false}
            className={`media-protected h-full w-full object-contain ${isLocked ? "wm-blurred" : ""}`}
          />
        ) : null}

        {isLocked ? (
          <div className="wm">
            <div className="wm-lock">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        ) : null}

        {index > 0 ? (
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Précédent"
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-2 text-white sm:flex"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
        {index < media.length - 1 ? (
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Suivant"
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-2 text-white sm:flex"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="flex justify-center gap-1.5 p-4">
        {media.map((dot, dotIndex) => (
          <span
            key={dot.id}
            className={`h-1.5 rounded-full transition-all ${
              dotIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
