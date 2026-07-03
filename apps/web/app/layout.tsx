import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Space_Grotesk, Kalam } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-kalam",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Souvenir — Transformez les souvenirs en revenus",
  description:
    "La plateforme clé en main pour vendre les photos et vidéos de vos activités outdoor. Une galerie privée par client, paiement et livraison automatiques.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${bricolage.variable} ${spaceGrotesk.variable} ${kalam.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
