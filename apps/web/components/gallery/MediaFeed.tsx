"use client";

import { useState } from "react";
import { MediaTile, type GalleryMedia } from "./MediaTile";
import { MediaLightbox } from "./MediaLightbox";
import { PhotoCarousel } from "./PhotoCarousel";

export type { GalleryMedia };

const PRIORITY_COUNT = 6;

export function MediaFeed({
  media,
  token,
  locked,
  gridClassName,
}: {
  media: GalleryMedia[];
  token: string;
  locked: boolean;
  gridClassName?: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (media.length === 0) return null;

  return (
    <>
      {/* ── Mobile : carousel plein format avec swipe-hint ── */}
      <div className="md:hidden">
        <PhotoCarousel media={media} locked={locked} onOpen={setActiveIndex} />
      </div>

      {/* ── Desktop : grille classique ── */}
      <div className={`hidden md:grid ${gridClassName ?? "grid-cols-3 gap-0.5"}`}>
        {media.map((item, index) => (
          <MediaTile
            key={item.id}
            item={item}
            locked={locked}
            priority={index < PRIORITY_COUNT}
            onOpen={() => setActiveIndex(index)}
          />
        ))}
      </div>

      {activeIndex !== null && (
        <MediaLightbox
          media={media}
          token={token}
          locked={locked}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  );
}
