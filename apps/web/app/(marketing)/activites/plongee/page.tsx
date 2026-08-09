import type { Metadata } from "next";
import { ActivityPlaceholder } from "@/components/marketing/ActivityPlaceholder";

export const metadata: Metadata = {
  title: "Linktrip — Plongée",
  description: "La boutique photo Linktrip pour les centres de plongée. Page en préparation.",
};

export default function PlongeePage() {
  return <ActivityPlaceholder activity="Plongée" />;
}
