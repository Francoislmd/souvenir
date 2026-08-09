import type { Metadata } from "next";
import { ActivityPlaceholder } from "@/components/marketing/ActivityPlaceholder";

export const metadata: Metadata = {
  title: "Linktrip — Canyoning",
  description: "La boutique photo Linktrip pour les centres de canyoning. Page en préparation.",
};

export default function CanyoningPage() {
  return <ActivityPlaceholder activity="Canyoning" />;
}
