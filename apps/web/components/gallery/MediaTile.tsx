"use client";

import type { MediaKind, MediaStatus } from "@souvenir/db";
import { GridVideo } from "./GridVideo";

export interface GalleryMedia {
  id: string;
  kind: MediaKind;
  status: MediaStatus;
  previewUrl: string | null;
  thumbUrl: string | null;
}

export function MediaTile({
  item,
  locked,
  onOpen,
}: {
  item: GalleryMedia;
  locked: boolean;
  onOpen: () => void;
}) {
  const isLocked = locked && item.status === "READY";

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={item.status !== "READY"}
      className="relative aspect-square overflow-hidden bg-canvas"
      onContextMenu={(event) => event.preventDefault()}
    >
      {item.status !== "READY" ? (
        <div className="flex h-full items-center justify-center text-center text-xs text-muted">
          Traitement en cours…
        </div>
      ) : item.kind === "VIDEO" && item.previewUrl ? (
        <GridVideo previewUrl={item.previewUrl} thumbUrl={item.thumbUrl} />
      ) : (
        <div
          role="img"
          aria-label=""
          className={`media-protected h-full w-full bg-cover bg-center ${isLocked ? "wm-blurred" : ""}`}
          style={{ backgroundImage: item.previewUrl ? `url(${item.previewUrl})` : undefined }}
        />
      )}

      {item.kind === "VIDEO" && item.status === "READY" ? (
        <span className="absolute right-1.5 top-1.5 z-[2] flex h-6 w-6 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M8 5v14l11-7-11-7Z" />
          </svg>
        </span>
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
    </button>
  );
}
