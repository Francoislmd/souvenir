export function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
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
  return `${formatDayFr(d)}, ${formatHourFr(d)}`;
}

/** "Samedi 5 septembre". */
export function formatDayFr(d: Date): string {
  return d
    .toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ })
    .replace(/^./, (c) => c.toUpperCase());
}

/** « de canyoning », « d'escalade » : pour « Vos photos de canyoning du 26 septembre ». */
export function photosOf(activity: string): string {
  const a = activity.trim();
  const lower = a.charAt(0).toLocaleLowerCase("fr") + a.slice(1);
  return /^[aeiouyhàâéèêëîïôöûùü]/i.test(lower) ? `d\u2019${lower}` : `de ${lower}`;
}
