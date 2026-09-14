/**
 * Lire une liste d'adresses dans ce que l'opérateur a sous la main.
 *
 * En fin de sortie, les adresses existent déjà ailleurs : une colonne de
 * tableur, un fil de réservations, une liste tapée par quelqu'un d'autre.
 * Les redemander une par une était le geste le plus cher de l'écran. Ici on
 * accepte n'importe quel bloc de texte et on en tire ce qui est une adresse,
 * sans imposer de séparateur, de format ni d'ordre.
 *
 * Volontairement permissif à la lecture, strict à la sortie : on ne garde que
 * ce qui ressemble vraiment à une adresse, en minuscules et sans doublon.
 */

// Ni chevrons ni ponctuation de liste dans les deux moitiés : « Julie
// <julie@ecole.fr>, » donne julie@ecole.fr. Le domaine finit sur une
// extension de deux lettres au moins, ce qui écarte les « 12@9 » d'un tableur.
const EMAIL_SOURCE = "[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}";
// Deux objets distincts : un `RegExp` global garde son `lastIndex` d'un appel
// au suivant, et le réutiliser pour tester ligne à ligne en sauterait une
// sur deux.
const ALL_EMAILS = new RegExp(EMAIL_SOURCE, "gi");
const ANY_EMAIL = new RegExp(EMAIL_SOURCE, "i");

export interface ParsedEmails {
  /** Les adresses retenues, dans leur ordre d'apparition. */
  emails: string[];
  /** Adresses déjà présentes, ou répétées dans le texte collé. */
  duplicates: number;
  /** Lignes non vides où aucune adresse n'a été trouvée. */
  ignored: number;
}

export function parseEmails(text: string, known: readonly string[] = []): ParsedEmails {
  const seen = new Set(known.map((e) => e.trim().toLowerCase()));
  const emails: string[] = [];
  let duplicates = 0;

  ALL_EMAILS.lastIndex = 0;
  for (const raw of text.match(ALL_EMAILS) ?? []) {
    // Un point final de phrase colle au domaine sans en faire partie.
    const email = raw.toLowerCase().replace(/\.+$/, "");
    if (seen.has(email)) {
      duplicates += 1;
      continue;
    }
    seen.add(email);
    emails.push(email);
  }

  const ignored = text.split(/[\r\n]+/).filter((line) => line.trim().length > 0 && !ANY_EMAIL.test(line)).length;

  return { emails, duplicates, ignored };
}

/** « 12 clients », « 1 client » — la même règle partout dans l'écran. */
export function clientCount(n: number): string {
  return `${n} client${n > 1 ? "s" : ""}`;
}

/** Ce que le collage vient de changer, en une phrase ou rien du tout. */
export function pasteSummary(parsed: ParsedEmails): string {
  const bits: string[] = [];
  if (parsed.duplicates > 0) {
    const s = parsed.duplicates > 1 ? "s" : "";
    bits.push(`${parsed.duplicates} doublon${s} écarté${s}`);
  }
  if (parsed.ignored > 0) {
    const s = parsed.ignored > 1 ? "s" : "";
    bits.push(`${parsed.ignored} ligne${s} sans adresse écartée${s}`);
  }
  return bits.length === 0 ? "" : `${bits.join(" et ")}.`;
}

/**
 * Un nom lisible tiré d'une adresse, pour les clients qu'on n'a jamais vus
 * autrement : « julie.marchand@ecole.fr » donne « Julie Marchand ». Il tient
 * la liste jusqu'à ce que le client paie et donne le sien.
 */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const name = local
    .split(/[._\-+]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .slice(0, 60)
    .trim();
  return name || email;
}
