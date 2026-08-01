import { startOfDay, endOfDay } from "@/lib/dates";
import type { SortieStatus } from "@souvenir/db";

export type SortieBucket = "today" | "upcoming" | "past";

export function bucketSortie(startsAt: Date, now: Date = new Date()): SortieBucket {
  if (startsAt >= startOfDay(now) && startsAt <= endOfDay(now)) return "today";
  return startsAt > endOfDay(now) ? "upcoming" : "past";
}

export function sortieStatusLabel(status: SortieStatus, bucket: SortieBucket): string {
  if (status === "SENT") return "Envoyée";
  if (status === "SORTED") return "Photos triées";
  return bucket === "past" ? "Non envoyée" : "À venir";
}

export type PublicationStatus = "online" | "pending" | "none";

/**
 * "en ligne" = la galerie a été envoyée aux clients (statut SENT) — elle
 * reste accessible par token quel que soit le statut, donc SENT est bien
 * le marqueur de publication, pas juste d'envoi.
 */
export function publicationStatus(photoCount: number, status: SortieStatus): PublicationStatus {
  if (photoCount === 0) return "none";
  return status === "SENT" ? "online" : "pending";
}

export function publicationStatusLabel(status: PublicationStatus): string {
  if (status === "online") return "Photos en ligne";
  if (status === "pending") return "Photos à publier";
  return "Sans photo";
}
