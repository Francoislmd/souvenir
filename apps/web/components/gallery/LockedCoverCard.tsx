"use client";

import { useEffect, useRef } from "react";
import { CheckoutButton } from "./CheckoutButton";

export function LockedCoverCard({
  deliveryId,
  priceCents,
  firstVideoUrl,
  firstPhotoUrl,
  videoCount,
}: {
  deliveryId: string;
  priceCents: number;
  firstVideoUrl: string | null;
  firstPhotoUrl: string | null;
  videoCount: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgUrl = firstVideoUrl ?? firstPhotoUrl;

  // Force play after mount — certains browsers bloquent autoPlay sans interaction
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => undefined);
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {bgUrl ? (
        <div className="relative overflow-hidden rounded-card" style={{ aspectRatio: "3/4" }}>
          {/* Fond : vidéo ou photo floutée */}
          {firstVideoUrl ? (
            <video
              ref={videoRef}
              src={firstVideoUrl}
              className="absolute inset-0 h-full w-full scale-110 object-cover"
              style={{ filter: "blur(14px)" }}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bgUrl}
              alt=""
              className="absolute inset-0 h-full w-full scale-110 object-cover"
              style={{ filter: "blur(14px)" }}
            />
          )}

          {/* Dégradé overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.20) 60%, transparent 100%)" }}
          />

          {/* Chips en haut */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            {firstVideoUrl && videoCount > 0 ? (
              <span className="flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                {/* caméra vidéo */}
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 10l4.553-2.53A1 1 0 0 1 21 8.382v7.236a1 1 0 0 1-1.447.894L15 14" />
                  <rect x="3" y="7" width="12" height="10" rx="2" />
                </svg>
                Vidéo
              </span>
            ) : null}
          </div>

          {/* Cadenas centré */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      ) : null}

      <CheckoutButton deliveryId={deliveryId} priceCents={priceCents} inline />
    </div>
  );
}
