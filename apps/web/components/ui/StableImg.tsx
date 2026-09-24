"use client";

import { useEffect, useState } from "react";

/**
 * Une image qui ne clignote jamais quand sa source change.
 *
 * Changer le `src` d'une balise img la vide le temps que la nouvelle image
 * arrive et se décode : quelques dixièmes de seconde sur un ordinateur,
 * plusieurs secondes en 4G. La grille d'une sortie changeait ainsi de
 * source trois fois par photo (fichier, vignette locale, vignette serveur),
 * et chaque changement se voyait comme une photo qui disparaît puis revient.
 *
 * Ici la nouvelle source est chargée et décodée à côté ; l'image affichée ne
 * change qu'une fois la suivante prête. Si elle n'arrive jamais, l'ancienne
 * reste.
 */
export function StableImg({ src, alt = "", eager = false }: { src: string; alt?: string; eager?: boolean }) {
  const [shown, setShown] = useState(src);

  useEffect(() => {
    if (src === shown) return;
    let cancelled = false;
    const next = new Image();
    next.decoding = "async";
    next.src = src;
    next.decode().then(
      () => {
        if (!cancelled) setShown(src);
      },
      () => {
        // Décodage refusé (image cassée, onglet en arrière-plan sur Safari) :
        // si elle a tout de même fini de charger, on la prend ; sinon on
        // garde celle qui s'affiche.
        if (!cancelled && next.complete && next.naturalWidth > 0) setShown(src);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [src, shown]);

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={shown} alt={alt} draggable={false} decoding="async" loading={eager ? "eager" : "lazy"} />;
}
