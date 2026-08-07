import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import styles from "@/app/(marketing)/landing.module.css";
import { TileArt, type TileArtKind } from "./TileArt";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const EXTENSIONS = ["webp", "jpg", "jpeg", "png"];

interface Tile {
  kind: TileArtKind;
  activity: string;
  place: string;
  count: number;
  ratio: "r34" | "r11" | "r45";
  /** Nom de base attendu dans /public/landing (n'importe quelle extension : .webp/.jpg/.jpeg/.png). */
  base: string;
  locked?: boolean;
  priority?: boolean;
  /** Répétition d'une photo déjà utilisée — uniquement pour remplir la colonne
      desktop (le fondu haut/bas a besoin d'au moins 4 tuiles par colonne pour
      toujours avoir quelque chose à rogner). Masquée sur mobile : là la
      mosaïque s'affiche en entier, sans rognage, donc pas de doublon visible. */
  duplicate?: boolean;
}

// Ordre de ratios imposé : colonne 1 → 3/4, 1/1, 4/5, 3/4 · colonne 2 → 4/5, 3/4, 1/1, 4/5.
const COL_A: Tile[] = [
  { kind: "via-ferrata", activity: "Tyrolienne", place: "Istanbul", count: 16, ratio: "r34", base: "tyrolienne", priority: true },
  { kind: "jetski", activity: "Jet ski", place: "Cangas", count: 24, ratio: "r11", base: "jetski" },
  { kind: "surf", activity: "Bouée tractée", place: "Dubaï", count: 19, ratio: "r45", base: "bouee-tractee" },
  { kind: "via-ferrata", activity: "Tyrolienne", place: "Istanbul", count: 16, ratio: "r34", base: "tyrolienne", duplicate: true },
];

const COL_B: Tile[] = [
  { kind: "surf", activity: "Bouée tractée", place: "Dubaï", count: 19, ratio: "r45", base: "bouee-tractee", priority: true, duplicate: true },
  // Verrouillée à dessein : le modèle économique reste visible dans le mur d'images.
  // Ici la source est une photo de marque (pas un achat client réel), donc le
  // flou CSS est acceptable — ne jamais faire ça sur une vraie photo HD d'un
  // client payant (piège §15) : générer une variante floutée côté serveur.
  { kind: "parapente", activity: "Parachute ascensionnel", place: "", count: 21, ratio: "r34", base: "parachute-ascensionnel", locked: true },
  { kind: "jetski", activity: "Jet ski", place: "Cangas", count: 24, ratio: "r11", base: "jetski", duplicate: true },
  { kind: "via-ferrata", activity: "Tyrolienne", place: "Istanbul", count: 16, ratio: "r45", base: "tyrolienne", duplicate: true },
];

function resolveImage(base: string): string | null {
  const dir = path.join(process.cwd(), "public", "landing");
  for (const ext of EXTENSIONS) {
    if (existsSync(path.join(dir, `${base}.${ext}`))) return `/landing/${base}.${ext}`;
  }
  return null;
}

function TileView({ tile }: { tile: Tile }) {
  const src = resolveImage(tile.base);

  return (
    <div className={cx(styles.tile, styles[tile.ratio], tile.duplicate && styles.hideMobile)}>
      {src ? (
        <Image
          src={src}
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
          {tile.place ? `${tile.place} · ` : ""}
          {tile.count} photos
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
          {COL_A.map((tile, i) => (
            <TileView key={`${tile.base}-a${i}`} tile={tile} />
          ))}
        </div>
        <div className={cx(styles.mcol, styles.mcolOffset)}>
          {COL_B.map((tile, i) => (
            <TileView key={`${tile.base}-b${i}`} tile={tile} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PhotoMosaic;
