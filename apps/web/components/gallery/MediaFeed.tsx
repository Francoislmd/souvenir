"use client";

import { useState } from "react";
import { MediaTile, type GalleryMedia } from "./MediaTile";
import { MediaLightbox } from "./MediaLightbox";

export type { GalleryMedia };

const PRIORITY_COUNT = 6; // premières tuiles eager (2 lignes × 3 colonnes)

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
      <div className={gridClassName ?? "grid grid-cols-3 gap-0.5"}>
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

      {activeIndex !== null ? (
        <MediaLightbox
          media={media}
          token={token}
          locked={locked}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      ) : null}
    </>
  );
}
