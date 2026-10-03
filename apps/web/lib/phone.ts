// Normalise un numéro français saisi en format local (06 12 34 56 78) en
// E.164 (+33612345678) — Twilio rejette tout le reste. Appelé par lib/twilio.ts,
// au seul point de contact avec Twilio.
export function toE164(phone: string): string {
  const digits = phone.replace(/[\s.()-]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+33${digits.slice(1)}`;
  return digits;
}

/**
 * Un numéro de téléphone lisible dans ce que tape un client ou ce que colle
 * un pro : « 06 12 34 56 78 », « +33 6 12 34 56 78 », « 0033612345678 ».
 * Rend l'E.164 (+33612345678), ou null si ce n'est pas un numéro.
 */
export function parsePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^[+\d][\d\s.()-]{7,20}$/.test(trimmed)) return null;
  const e164 = toE164(trimmed);
  if (!/^\+\d{8,15}$/.test(e164)) return null;
  // Un numéro français fait toujours 9 chiffres après +33.
  if (e164.startsWith("+33") && e164.length !== 12) return null;
  return e164;
}

/** « 06 12 34 56 78 » pour un numéro français, l'E.164 tel quel sinon. */
export function formatPhone(e164: string): string {
  if (/^\+33\d{9}$/.test(e164)) {
    const local = `0${e164.slice(3)}`;
    return local.replace(/(\d{2})(?=\d)/g, "$1 ");
  }
  return e164;
}

/** Les écritures sous lesquelles un même numéro a pu être enregistré. */
export function phoneVariants(e164: string): string[] {
  const variants = new Set([e164]);
  if (e164.startsWith("+33")) {
    const local = `0${e164.slice(3)}`;
    variants.add(local);
    variants.add(formatPhone(e164));
    variants.add(local.replace(/(\d{2})(?=\d)/g, "$1."));
  }
  return Array.from(variants);
}
