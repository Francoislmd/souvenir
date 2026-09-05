"use client";

import { useEffect, type RefObject } from "react";

export interface SyncedField {
  ref: RefObject<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Chrome remplit les champs enregistrés sans déclencher l'événement que React
 * écoute : le DOM porte une valeur, l'état du composant reste vide. Sur un
 * formulaire dont le bouton dépendait de cet état, on se retrouvait avec un
 * bouton grisé sur un formulaire visiblement rempli, sans aucun moyen d'en
 * sortir — c'est arrivé en vrai sur l'écran de connexion.
 *
 * On relit donc le DOM au montage, puis deux fois de suite : le remplissage
 * arrive tantôt avant l'hydratation, tantôt quelques centaines de
 * millisecondes après. La lecture des refs au moment de l'envoi reste le
 * garde-fou : c'est elle qui garantit qu'on envoie ce que l'utilisateur voit.
 */
export function useAutofillSync(fields: SyncedField[]): void {
  useEffect(() => {
    const sync = (): void => {
      for (const field of fields) {
        const domValue = field.ref.current?.value;
        if (domValue != null && domValue !== field.value) field.onChange(domValue);
      }
    };
    sync();
    const soon = setTimeout(sync, 120);
    const later = setTimeout(sync, 600);
    return () => {
      clearTimeout(soon);
      clearTimeout(later);
    };
    // Une seule passe au montage : ensuite les frappes suffisent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
