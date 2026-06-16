export function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

/** RGPD §11 : jamais le téléphone en entier — on ne garde que les 4 derniers chiffres. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last = digits.slice(-4);
  return `…${last.slice(0, 2)} ${last.slice(2)}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
}
