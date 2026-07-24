import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

async function main() {
  const { sendPhotosReadyEmail } = await import("../lib/email");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_xxxxxxxxx") {
    throw new Error("RESEND_API_KEY manquante — renseigne ta vraie clé dans apps/web/.env.local");
  }

  const galleryUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/g/demo`
    : "https://example.com/g/demo";

  await sendPhotosReadyEmail({
    to: "francoislemarchand4@gmail.com",
    token: "demo",
    operatorId: "demo",
    firstName: "Léa",
    operatorName: "Vol Passion Annecy",
    operatorColor: "#FF5A1F",
    sortieDate: "22 juillet",
    sortiePlace: "Forclaz",
    freeCount: 2,
    paidCount: 7,
    heroUrl: "https://placehold.co/1120x460/7FC5EE/FFF.jpg",
    thumbUrls: [
      "https://placehold.co/330x330/F3C9A0/FFF.jpg",
      "https://placehold.co/330x330/FFC58E/FFF.jpg",
      "https://placehold.co/330x330/AEDCF3/FFF.jpg",
    ],
    galleryUrl,
    deleteUrl: `${galleryUrl}/supprimer`,
    unsubUrl: `${galleryUrl}/desinscription`,
  });

  console.log("Email envoyé.");
}

main();
