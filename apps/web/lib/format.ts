export function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

/** RGPD §11 : jamais le téléphone en entier — on ne garde que les 4 derniers chiffres. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last = digits.slice(-4);
  return `…${last.slice(0, 2)} ${last.slice(2)}`;
}

/** "Mar. 28 juil." — jour et mois abrégés, comme dans le tableau des sorties. */
export function formatDateShortFr(d: Date): string {
  const formatted = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  return formatted.replace(/^./, (c) => c.toUpperCase());
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
}

// Le marché est français : tout ce qui est présenté au client final est
// daté en heure de Paris, quel que soit le fuseau du serveur qui rend la
// page (souvent UTC en production).
const TZ = "Europe/Paris";

/** "Rafting, Basse Ardèche" — l'activité, et le lieu s'il est renseigné. */
export function formatSortieTitle(activity: string, place?: string | null): string {
  return place ? `${activity}, ${place}` : activity;
}

/** "9 h 30", "14 h" — jamais "09:30", qui se lit comme un horaire de train. */
export function formatHourFr(d: Date): string {
  const parts = new Intl.DateTimeFormat("fr-FR", { hour: "numeric", minute: "2-digit", hourCycle: "h23", timeZone: TZ }).formatToParts(d);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return minute === "00" ? `${Number(hour)} h` : `${Number(hour)} h ${minute}`;
}

/**
 * "Samedi 5 septembre, 9 h 30" — la ligne que le client lit pour vérifier
 * qu'il est au bon endroit. Le jour de la semaine compte autant que la
 * date : c'est comme ça qu'on se souvient d'une sortie.
 */
export function formatWhenFr(d: Date): string {
  const day = d
    .toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ })
    .replace(/^./, (c) => c.toUpperCase());
  return `${day}, ${formatHourFr(d)}`;
}
