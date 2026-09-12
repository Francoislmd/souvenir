import styles from "./spinner.module.css";

export type SpinnerTone = "brand" | "current" | "light";

/**
 * La moulinette d'attente du produit. Un seul composant pour toute
 * l'application : les créneaux, les photos, les horaires, les boutons et les
 * écrans de route montrent le même objet, à des tailles différentes.
 *
 * `tone="current"` prend la couleur du texte autour : c'est celui des
 * boutons, qui vont du blanc sur encre au gris sur fond clair.
 */
export function Spinner({
  size = 18,
  tone = "brand",
  className,
  label = "Chargement en cours",
}: {
  size?: number;
  tone?: SpinnerTone;
  className?: string;
  /** Lu par les lecteurs d'écran ; la moulinette elle-même reste décorative. */
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`${styles.sp} ${styles[tone]} ${className ?? ""}`}
      style={{ "--sp-size": `${size}px`, "--sp-w": `${Math.max(2, Math.round(size / 8.5))}px` } as React.CSSProperties}
    />
  );
}

/**
 * Une zone qui attend ses données : la moulinette centrée, et une phrase qui
 * dit ce qu'on attend. Remplace la place vide que laissaient les listes de
 * créneaux et les grilles de photos pendant leur chargement.
 */
export function LoadingBlock({
  label,
  size = 26,
  tone = "brand",
  pad,
}: {
  label?: string;
  size?: number;
  tone?: SpinnerTone;
  /** Hauteur de respiration, en pixels, quand la zone est serrée. */
  pad?: number;
}) {
  return (
    <div className={styles.block} style={pad === undefined ? undefined : ({ "--sp-pad": `${pad}px` } as React.CSSProperties)}>
      <Spinner size={size} tone={tone} label={label ?? "Chargement en cours"} />
      {label ? <p className={styles.label}>{label}</p> : null}
    </div>
  );
}

/**
 * La moulinette d'une vignette dont l'aperçu n'est pas encore arrivé : le
 * worker traite les photos pendant que le client regarde déjà la grille.
 */
export function TileSpinner({ tone = "brand", size = 20 }: { tone?: SpinnerTone; size?: number }) {
  return (
    <span className={styles.tile} aria-hidden="true">
      <Spinner size={size} tone={tone} label="Aperçu en cours de préparation" />
    </span>
  );
}
