import type { Metadata } from "next";
import { ActivityPlaceholder } from "@/components/marketing/ActivityPlaceholder";

export const metadata: Metadata = {
  title: "Linktrip — Surf",
  description: "La boutique photo Linktrip pour les écoles de surf. Page en préparation.",
};

export default function SurfPage() {
  return <ActivityPlaceholder activity="Surf" />;
}
