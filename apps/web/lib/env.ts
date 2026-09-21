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
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  // Charge directe : paiements, remboursements, litiges et account.updated se
  // produisent sur les comptes des opérateurs. Stripe ne les envoie qu'à un
  // endpoint « Connect », qui a son propre secret de signature.
  STRIPE_CONNECT_WEBHOOK_SECRET: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_WHATSAPP_FROM: z.string().min(1),
  TWILIO_SMS_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  // Le sous-domaine des boutiques (store.linktrip.co). Facultative : en local
  // et sur les previews Vercel il n'y a pas de sous-domaine, les boutiques se
  // servent alors depuis NEXT_PUBLIC_APP_URL sur /s/{slug}/{code}.
  //
  // Passe par le préprocesseur comme les autres variables facultatives à
  // format contraint : la clé posée mais laissée vide (c'est ce que donne
  // .env.example recopié tel quel, et une variable Vercel créée sans valeur)
  // est une chaîne vide, que `.url()` refuse. Le parse échouant au chargement
  // du module, TOUTE page rendue côté serveur tombe en 500, pas seulement les
  // boutiques.
  NEXT_PUBLIC_STORE_URL: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url().optional(),
  ),
  CRON_SECRET: z.string().min(20),
  // Stockage des fichiers : Cloudflare R2 (lib/storage.ts).
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_ORIGINALS: z.string().min(1).default("originals"),
  R2_BUCKET_PREVIEWS: z.string().min(1).default("previews"),
  // Domaine public du bucket previews (ex. https://media.linktrip.co).
  R2_PREVIEWS_PUBLIC_URL: z.string().url(),
  // Facultative : un autre point d'accès S3 (MinIO en test). Vide = R2.
  R2_ENDPOINT: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url().optional(),
  ),
  // Plafond total de stockage, en Go (10^9 octets). 9 par défaut : l'offre
  // gratuite de R2 est de 10 Go, on garde 1 Go de marge (logos, couvertures,
  // envois en cours). Voir lib/storage-quota.ts.
  STORAGE_QUOTA_GB: z.coerce.number().positive().default(9),
  // Mesure d'audience — optionnelles : sans elles, aucune balise n'est chargée
  // (utile en local et sur les previews Vercel, qui ne doivent pas polluer GA4).
  NEXT_PUBLIC_GTM_ID: optionalPattern(/^GTM-[A-Z0-9]+$/, "Format attendu : GTM-XXXXXXX"),
  NEXT_PUBLIC_GA4_ID: optionalPattern(/^G-[A-Z0-9]+$/, "Format attendu : G-XXXXXXXXXX"),
});

export const env = envSchema.parse(process.env);
