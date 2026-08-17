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
  caption?: { title: string; subtitle: string };
  priority?: boolean;
}

// Ordre du fond vers l'avant (détermine l'empilement via nth-child en CSS).
const CARDS: Card[] = [
  { base: "pexels-hilmiisilak-11183386", alt: "Rafting en eaux vives" },
  { base: "bouee-tractee", alt: "Bouée tractée à Dubaï" },
  { base: "pexels-bita-kahshidi-1155551613-24963091", alt: "Parachute ascensionnel" },
  {
    base: "pexels-mike-art-visual-creator-photography-and-video-2159421235-36621111",
    alt: "Jet ski à Cangas",
    caption: { title: "Jet ski", subtitle: "Cangas · 24 photos" },
    priority: true,
  },
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
              {card.caption && <div className={styles.stackCaptionVeil} />}
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
