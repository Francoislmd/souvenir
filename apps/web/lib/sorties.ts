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
