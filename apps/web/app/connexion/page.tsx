import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifiedEmail } from "@/lib/current-user";
import { ConnexionScreen } from "./ConnexionScreen";

export const metadata: Metadata = {
  title: "Connexion · Linktrip",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

// Déjà connecté : pas d'écran de connexion, on repart là où il en était.
export default async function ConnexionPage() {
  const email = await verifiedEmail();
  if (email) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    redirect(user ? "/sorties" : "/signup");
  }
  return <ConnexionScreen />;
}
