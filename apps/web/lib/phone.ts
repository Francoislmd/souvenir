// Normalise un numéro français saisi en format local (06 12 34 56 78) en E.164
// (+33612345678), cf. CLAUDE.md §11 — Twilio rejette les numéros non E.164.
export function toE164(phone: string): string {
  const digits = phone.replace(/[\s.-]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return `+33${digits.slice(1)}`;
  return digits;
}
