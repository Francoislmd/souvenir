import type { Metadata } from "next";
import { ActivityPlaceholder } from "@/components/marketing/ActivityPlaceholder";

export const metadata: Metadata = {
  title: "Linktrip — Parapente",
  description: "La boutique photo Linktrip pour les écoles de parapente. Page en préparation.",
};

export default function ParapentePage() {
  return <ActivityPlaceholder activity="Parapente" />;
}
