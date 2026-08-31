import { z } from "zod";

/**
 * Variable facultative dont le format est contraint : une chaîne vide (clé
 * présente mais non renseignée dans .env) doit être traitée comme absente,
 * sinon le regex ferait échouer le boot en local.
 */
const optionalPattern = (re: RegExp, message: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().regex(re, message).optional(),
  );

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Stockage des fichiers : Cloudflare R2, séparé de Supabase depuis le
  // 31/08/2026 (egress gratuit, et un bucket plein ne peut plus couper l'auth).
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_ORIGINALS: z.string().min(1).default("originals"),
  R2_BUCKET_PREVIEWS: z.string().min(1).default("previews"),
  // Domaine public du bucket previews (custom domain Cloudflare, ou r2.dev en
  // développement). Sans lui, aucune galerie ne peut afficher d'aperçu.
  R2_PREVIEWS_PUBLIC_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_WHATSAPP_FROM: z.string().min(1),
  TWILIO_SMS_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  CRON_SECRET: z.string().min(20),
  // Mesure d'audience — optionnelles : sans elles, aucune balise n'est chargée
  // (utile en local et sur les previews Vercel, qui ne doivent pas polluer GA4).
  NEXT_PUBLIC_GTM_ID: optionalPattern(/^GTM-[A-Z0-9]+$/, "Format attendu : GTM-XXXXXXX"),
  NEXT_PUBLIC_GA4_ID: optionalPattern(/^G-[A-Z0-9]+$/, "Format attendu : G-XXXXXXXXXX"),
});

export const env = envSchema.parse(process.env);
