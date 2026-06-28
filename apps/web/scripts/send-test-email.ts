import { config } from "dotenv";
import { resolve } from "path";
import { Resend } from "resend";

config({ path: resolve(__dirname, "../.env.local") });

async function main() {
  const { renderDeliveryEmailHtml } = await import("../lib/email");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_xxxxxxxxx") {
    throw new Error("RESEND_API_KEY manquante — renseigne ta vraie clé dans apps/web/.env.local");
  }

  const resend = new Resend(apiKey);

  const html = renderDeliveryEmailHtml({
    operatorName: "Vol Passion Annecy",
    logoUrl: null,
    galleryUrl: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/g/demo`
      : "https://example.com/g/demo",
    message: "Léa, tes souvenirs de vol sont prêts ! Retrouve tes photos et vidéos dans ta galerie personnelle.",
  });

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: "francoislemarchand4@gmail.com",
    subject: "Tes souvenirs de vol t'attendent, Léa 📸",
    html,
  });

  console.log(JSON.stringify(result, null, 2));
}

main();
