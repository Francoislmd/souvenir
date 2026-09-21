import styles from "@/components/ui/video-badge.module.css";
import { formatDuration } from "@/lib/media";

function Triangle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

/** Pastille « ▶ 0:42 » posée sur la vignette d'une vidéo (le parent est en position: relative). */
export function VideoBadge({ durationSec }: { durationSec?: number | null }) {
  const duration = formatDuration(durationSec);
  return (
    <span className={styles.pill} aria-label={duration ? `Vidéo, ${duration}` : "Vidéo"}>
      <Triangle size={11} />
      {duration ?? "Vidéo"}
    </span>
  );
}

/** Triangle de lecture au centre d'une vignette. */
export function PlayMark() {
  return (
    <span className={styles.play} aria-hidden="true">
      <Triangle size={24} />
    </span>
  );
}

/**
 * Aperçu local d'une vidéo pas encore traitée, tiré du fichier sur
 * l'appareil : le navigateur affiche l'image à 0,5 s. Une balise img sur
 * l'URL d'une vidéo ne montrerait rien.
 */
export function LocalVideoThumb({ src }: { src: string }) {
  return <video className={styles.local} src={`${src}#t=0.5`} muted playsInline preload="metadata" />;
}
