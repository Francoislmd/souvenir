import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import styles from "@/app/(marketing)/landing.module.css";
import { TileArt, type TileArtKind } from "./TileArt";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

interface Tile {
  kind: TileArtKind;
  activity: string;
  place: string;
  count: number;
  ratio: "r34" | "r11" | "r45";
  /** Nom de fichier attendu dans /public/landing — dépose-le pour remplacer l'illustration. */
  file: string;
  locked?: boolean;
  priority?: boolean;
}

const COL_A: Tile[] = [
  { kind: "parapente", activity: "Parapente", place: "Annecy", count: 14, ratio: "r34", file: "parapente.webp", priority: true },
  { kind: "kayak", activity: "Kayak de mer", place: "Crozon", count: 22, ratio: "r11", file: "kayak.webp" },
  { kind: "surf", activity: "Cours de surf", place: "Hossegor", count: 31, ratio: "r45", file: "surf.webp" },
];

const COL_B: Tile[] = [
  { kind: "via-ferrata", activity: "Via ferrata", place: "Chamonix", count: 18, ratio: "r45", file: "via-ferrata.webp", priority: true },
  // Verrouillée à dessein : le modèle économique reste visible dans le mur d'images.
  // Le fichier attendu doit déjà être une version dégradée/floutée (cf. §14 du brief) —
  // ne jamais poser un filter:blur() CSS sur une vraie photo HD ici (piège §15).
  { kind: "jetski", activity: "Jet ski", place: "Dieppe", count: 24, ratio: "r34", file: "jetski-locked.webp", locked: true },
  { kind: "plongee", activity: "Baptême de plongée", place: "Marseille", count: 12, ratio: "r11", file: "plongee.webp" },
];

function TileView({ tile }: { tile: Tile }) {
  const filePath = path.join(process.cwd(), "public", "landing", tile.file);
  const hasImage = existsSync(filePath);

  return (
    <div className={cx(styles.tile, styles[tile.ratio])}>
      {hasImage ? (
        <Image
          src={`/landing/${tile.file}`}
          alt=""
          fill
          sizes="(max-width: 1000px) 50vw, 25vw"
          priority={tile.priority}
          className={cx("object-cover", tile.locked && styles.tileLockedArt)}
        />
      ) : (
        <TileArt kind={tile.kind} className={cx(styles.tileArt, tile.locked && styles.tileLockedArt)} />
      )}
      <div className={styles.tileVeil} />
      {tile.locked && (
        <>
          <div className={styles.tileLock} aria-hidden="true">
            <svg viewBox="0 0 24 24" width={21} height={21} fill="none" stroke="#E8460C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4.5" y="10.5" width="15" height="10" rx="2.6" />
              <path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9" />
            </svg>
          </div>
          <div className={styles.tilePrice}>20 €</div>
        </>
      )}
      <div className={styles.tileTag}>
        {tile.activity}
        <span>
          {tile.place} · {tile.count} photos
        </span>
      </div>
    </div>
  );
}

export function PhotoMosaic() {
  return (
    <div className={styles.scene}>
      <div className={styles.mos}>
        <div className={styles.mcol}>
          {COL_A.map((tile) => (
            <TileView key={tile.file} tile={tile} />
          ))}
        </div>
        <div className={cx(styles.mcol, styles.mcolOffset)}>
          {COL_B.map((tile) => (
            <TileView key={tile.file} tile={tile} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PhotoMosaic;
