import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import "@/styles/tokens.css";

// Les variables --font-bricolage / --font-space-grotesk sont conservées pour
// ne pas casser tous les composants qui les référencent déjà : on y fait
// simplement pointer les polices Linktrip (Inter Tight pour les titres, Inter
// pour le corps de texte).
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-bricolage",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Linktrip — Vos photos de sortie deviennent un revenu",
  description:
    "SaaS pour prestataires d'activités outdoor : vos guides prennent des photos, vos clients les achètent, vous touchez une commission automatiquement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${interTight.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
