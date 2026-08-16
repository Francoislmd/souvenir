import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import styles from "@/app/(marketing)/landing.module.css";

const EXTENSIONS = ["webp", "jpg", "jpeg", "png"];

function resolveImage(base: string): string | null {
  const dir = path.join(process.cwd(), "public", "landing");
  for (const ext of EXTENSIONS) {
    if (existsSync(path.join(dir, `${base}.${ext}`))) return `/landing/${base}.${ext}`;
  }
  return null;
}

interface Card {
  base: string;
  alt: string;
  locked?: boolean;
  caption?: { title: string; subtitle: string };
  priority?: boolean;
}

// Ordre du fond vers l'avant (détermine l'empilement via nth-child en CSS).
const CARDS: Card[] = [
  { base: "parachute-ascensionnel", alt: "", locked: true },
  { base: "tyrolienne", alt: "Tyrolienne à Istanbul" },
  { base: "bouee-tractee", alt: "Bouée tractée à Dubaï" },
  { base: "jetski", alt: "Jet ski à Cangas", caption: { title: "Jet ski", subtitle: "Cangas · 24 photos" }, priority: true },
];

export function PhotoStack() {
  return (
    <div className={styles.stack}>
      {CARDS.map((card) => {
        const src = resolveImage(card.base);
        return (
          <div key={card.base} className={styles.stackCard}>
            <div className={styles.stackCardInner}>
              {src && (
                <Image
                  src={src}
                  alt={card.alt}
                  fill
                  sizes="(max-width: 900px) 66vw, 33vw"
                  priority={card.priority}
                  className={`object-cover ${styles.stackImg}`}
                />
              )}
              {card.locked && <div className={styles.stackLockedVeil} />}
              {card.locked && (
                <>
                  <div className={styles.stackLockBadge} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="#E8460C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4.5" y="10.5" width="15" height="10" rx="2.6" />
                      <path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9" />
                    </svg>
                  </div>
                  <div className={styles.stackPrice}>20 €</div>
                </>
              )}
              {card.caption && (
                <div className={styles.stackCaption}>
                  <span className={styles.stackCaptionTitle}>{card.caption.title}</span>
                  <span className={styles.stackCaptionSubtitle}>{card.caption.subtitle}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PhotoStack;
