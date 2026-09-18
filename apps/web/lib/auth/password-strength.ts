/**
 * Linktrip — robustesse du mot de passe.
 *
 * Principe : la LONGUEUR prime sur la complexité. Aucune règle de composition
 * imposée (pas de « au moins un caractère spécial ») — ces règles poussent aux
 * « Motdepasse1! », faibles et oubliés. On bloque en revanche les mots courants.
 *
 * Cette fonction sert l'affichage côté client. Le serveur doit refaire la
 * vérification : ne jamais faire confiance au navigateur.
 */

export type Score = 0 | 1 | 2 | 3 | 4;

export const MIN_LENGTH = 10;

/** Mots à bannir : classiques FR/EN + vocabulaire de la marque et du métier. */
const COMMON = [
  "motdepasse", "password", "azerty123", "123456789", "qwertyuiop",
  "linktrip", "parapente", "canyoning", "bonjour", "soleil", "annecy",
];

export function score(pw: string): Score {
  if (!pw) return 0;

  const low = pw.toLowerCase();

  // 1 · Mot courant dominant → faible.
  //    « parapente » ou « Annecy2026 » → faible. « ParapenteAnnecy2026! » → fort.
  for (const w of COMMON) {
    if (low.includes(w) && pw.length - w.length < 6) return 1;
  }

  if (pw.length < MIN_LENGTH) return 1;

  // 2 · Score par LONGUEUR d'abord — une phrase de passe tout en minuscules
  //    est plus solide qu'un « Abc1! » réputé « complexe ».
  let lower = false, upper = false, digit = false, symbol = false;
  for (const c of pw) {
    if (c >= "a" && c <= "z") lower = true;
    else if (c >= "A" && c <= "Z") upper = true;
    else if (c >= "0" && c <= "9") digit = true;
    else symbol = true;
  }
  const kinds = [lower, upper, digit, symbol].filter(Boolean).length;

  let s: Score;
  if (pw.length >= 18) s = 4;
  else if (pw.length >= 16 && kinds >= 2) s = 4;
  else if (pw.length >= 12) s = 3;
  else s = 2;

  // 3 · Pénalité : suite (1234, abcd) ou répétition (aaaa) de 4 caractères ou plus.
  if (hasRun(pw)) s = Math.min(s, 2) as Score;

  return s;
}

/** Détecte une suite croissante/décroissante ou une répétition de 4 caractères. */
function hasRun(pw: string): boolean {
  let up = 1, down = 1, same = 1;
  for (let i = 1; i < pw.length; i++) {
    const d = pw.charCodeAt(i) - pw.charCodeAt(i - 1);
    up = d === 1 ? up + 1 : 1;
    down = d === -1 ? down + 1 : 1;
    same = d === 0 ? same + 1 : 1;
    if (up >= 4 || down >= 4 || same >= 4) return true;
  }
  return false;
}

export const LABELS: Record<Score, string> = {
  0: "",
  1: "Trop court ou trop courant",
  2: "Un peu faible",
  3: "Correct",
  4: "Solide",
};

/** Seuil d'acceptation : on refuse 0 et 1, on accepte à partir de 2. */
export function isAcceptable(pw: string): boolean {
  return score(pw) >= 2;
}

/** Validation d'email, volontairement permissive : le seul vrai test est l'envoi. */
export function isEmail(v: string): boolean {
  const s = v.trim();
  return (
    s.length > 5 &&
    !s.includes(" ") &&
    s.indexOf("@") > 0 &&
    s.lastIndexOf(".") > s.indexOf("@") + 1 &&
    s.lastIndexOf(".") < s.length - 1
  );
}
