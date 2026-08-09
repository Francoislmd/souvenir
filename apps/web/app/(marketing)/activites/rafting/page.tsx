import type { Metadata } from "next";
import { ActivityPlaceholder } from "@/components/marketing/ActivityPlaceholder";

export const metadata: Metadata = {
  title: "Linktrip — Rafting",
  description: "La boutique photo Linktrip pour les bases de rafting. Page en préparation.",
};

export default function RaftingPage() {
  return <ActivityPlaceholder activity="Rafting" />;
}
