/* Filigrane de marque posé sur les photos protégées (héros, carte « Vous les
   vendez », scène de l'étape 03).

   Deux choses à ne pas changer sans raison :
   — la marque est écrite en <span> dans le DOM, jamais en motif SVG de fond :
     une capture d'écran doit emporter le filigrane avec elle ;
   — une ligne sur deux est décalée d'une demi-cellule, sinon la répétition
     dessine des colonnes verticales très visibles. Le décalage vient du CSS
     (`.scWmRow:nth-child(even)`), pas d'ici. */

interface FiligraneProps {
  /** Nombre de lignes ; 7 sur une photo pleine, 6 sur une carte. */
  rows: number;
  /** Répétitions par ligne. */
  cols: number;
}

export function Filigrane({ rows, cols }: FiligraneProps) {
  return (
    <div className="scWm" aria-hidden="true">
      {Array.from({ length: rows }, (_, r) => (
        <div className="scWmRow" key={r}>
          {Array.from({ length: cols }, (_, c) => (
            <span key={c}>
              <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round">
                <path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" />
                <circle cx="73" cy="27" r="10" fill="currentColor" stroke="none" />
              </svg>
              LINKTRIP
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
