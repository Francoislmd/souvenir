"use client";

import styles from "@/components/gallery/gallery.module.css";

/**
 * Reculer d'un écran. Un seul objet pour tout le parcours client, toujours
 * au même endroit : au-dessus du titre.
 *
 * Avant, chaque écran inventait son recul — « Changer de créneau » glissé
 * au milieu de la phrase d'aide, « Changer de jour » en bas de page. Deux
 * formulations, deux emplacements, et aucun des deux là où la main va
 * chercher un retour.
 *
 * `className` n'existe que pour la page de retrait, qui a sa propre feuille
 * (collective.module.css) mais doit reculer exactement pareil.
 */
export function BackLink({ label = "Retour", className, onClick }: { label?: string; className?: string; onClick: () => void }) {
  return (
    <button type="button" className={className ?? styles.back} onClick={onClick}>
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14.5 5 8 12l6.5 7" />
      </svg>
      {label}
    </button>
  );
}
