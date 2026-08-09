import type { Metadata } from "next";
import { ActivityPlaceholder } from "@/components/marketing/ActivityPlaceholder";

export const metadata: Metadata = {
  title: "Linktrip — Parc aventure",
  description: "La boutique photo Linktrip pour les parcs aventure. Page en préparation.",
};

export default function ParcAventurePage() {
  return <ActivityPlaceholder activity="Parc aventure" />;
}
