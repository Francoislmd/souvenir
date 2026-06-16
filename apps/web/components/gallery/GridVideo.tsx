"use client";

import { useEffect, useRef } from "react";

export function GridVideo({ previewUrl, thumbUrl }: { previewUrl: string; thumbUrl: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      preload="metadata"
      poster={thumbUrl ?? undefined}
      onContextMenu={(event) => event.preventDefault()}
      className="media-protected h-full w-full bg-black object-cover"
    >
      <source src={previewUrl} />
    </video>
  );
}
