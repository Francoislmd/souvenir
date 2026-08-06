"use client";

import { useRef, useState } from "react";
import styles from "@/app/(marketing)/landing.module.css";
import { trackEvent } from "@/lib/marketing-analytics";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

interface VideoPlayerProps {
  hasVideo: boolean;
  hasPoster: boolean;
  videoSrc: string;
  posterSrc: string;
}

export function VideoPlayer({ hasVideo, hasPoster, videoSrc, posterSrc }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const firedComplete = useRef(false);

  function handlePlay() {
    if (!hasVideo) return;
    setPlaying(true);
    trackEvent("video_play");
  }

  if (playing) {
    return (
      <div className={styles.player}>
        <video
          src={videoSrc}
          poster={hasPoster ? posterSrc : undefined}
          controls
          autoPlay
          playsInline
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (!firedComplete.current && v.duration && v.currentTime / v.duration >= 0.9) {
              firedComplete.current = true;
              trackEvent("video_complete");
            }
          }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      className={cx(styles.player, !hasVideo && "cursor-not-allowed")}
      aria-label="Lire la démonstration produit"
      style={hasPoster ? { backgroundImage: `url(${posterSrc})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {!hasPoster && (
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute inset-0" style={{ background: "linear-gradient(168deg,#7FB2DE,#B9D6EC 42%,#E4EBEC 54%,#3F7EA8 56%,#22587E)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(26% 30% at 74% 20%, rgba(255,255,255,.9), transparent 70%)" }} />
        </div>
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,14,18,.30), rgba(10,14,18,.14) 45%, rgba(10,14,18,.58))" }} />
      <span className={styles.playBtn} />
      <span className={styles.playerDur}>1 min 40</span>
      <span className={styles.playerLabel}>
        Démonstration produit
        <span>Créer une sortie, verser les photos, encaisser</span>
      </span>
    </button>
  );
}

export default VideoPlayer;
