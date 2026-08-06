/**
 * Illustration vectorielle de secours pour une tuile de la mosaïque, tant que
 * la vraie photo n'est pas fournie (cf. PhotoMosaic — vérification de fichier
 * côté serveur). Purement décoratif : pas d'alt, aria-hidden.
 */
export type TileArtKind = "parapente" | "kayak" | "surf" | "via-ferrata" | "jetski" | "plongee";

const SKY: Record<TileArtKind, string> = {
  parapente: "linear-gradient(175deg,#6FA8DC,#A9CDE9 46%,#D9E7F1)",
  kayak: "linear-gradient(175deg,#8FC3D6,#5E93AE 58%,#2F6A88)",
  surf: "linear-gradient(175deg,#F4C98E,#F8DEB9 44%,#E8C9A0)",
  "via-ferrata": "linear-gradient(175deg,#BFCBD6,#E2E8EE 48%,#93A5B4)",
  jetski: "linear-gradient(175deg,#F3B9A6,#F8D8C9 46%,#DFA089)",
  plongee: "linear-gradient(175deg,#A6CDBB,#D5E7DC 48%,#88AE9A)",
};

const SILHOUETTE: Record<TileArtKind, string> = {
  parapente:
    "M14 40 C30 18,70 18,86 40 C74 34,60 32,50 33 C40 32,26 34,14 40 Z M28 41 L48 62 M72 41 L52 62 M50 66 m-4.6,0 a4.6,4.6 0 1,0 9.2,0 a4.6,4.6 0 1,0 -9.2,0",
  kayak: "M16 72 C34 82,66 82,84 72 C66 78,34 78,16 72 Z M50 56 m-4.6,0 a4.6,4.6 0 1,0 9.2,0 a4.6,4.6 0 1,0 -9.2,0 M28 58 L72 68",
  surf: "M0 74 C20 66,34 82,52 74 C68 67,84 78,100 71 L100 100 L0 100 Z M48 52 m-4.4,0 a4.4,4.4 0 1,0 8.8,0 a4.4,4.4 0 1,0 -8.8,0",
  "via-ferrata": "M0 100 L0 40 L26 22 L46 46 L70 16 L100 44 L100 100 Z M56 58 m-4.2,0 a4.2,4.2 0 1,0 8.4,0 a4.2,4.2 0 1,0 -8.4,0",
  jetski: "M14 70 C34 60,62 58,86 66 C74 76,40 80,14 70 Z M50 50 m-4.6,0 a4.6,4.6 0 1,0 9.2,0 a4.6,4.6 0 1,0 -9.2,0",
  plongee: "M22 60 C36 44,64 44,78 60 C66 54,34 54,22 60 Z M46 54 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0",
};

export function TileArt({ kind, className }: { kind: TileArtKind; className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div style={{ position: "absolute", inset: 0, background: SKY[kind] }} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path d={SILHOUETTE[kind]} fill="rgba(22,19,32,.72)" stroke="rgba(22,19,32,.6)" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

export default TileArt;
