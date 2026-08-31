import { z } from "zod";

// Depuis le 31/08/2026 le worker ne parle plus du tout à Supabase : il lit la
// base par DATABASE_URL et les fichiers par R2. Deux secrets de moins à
// déposer sur l'hôte du worker.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_ORIGINALS: z.string().min(1).default("originals"),
  R2_BUCKET_PREVIEWS: z.string().min(1).default("previews"),
});

export const env = envSchema.parse(process.env);
