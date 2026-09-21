import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

/**
 * Installe le stockage R2 : crée les deux buckets s'ils manquent et pose la
 * règle CORS du bucket originals. Joué une fois par environnement :
 *   pnpm --filter @souvenir/web setup:storage
 *
 * CORS : le navigateur de l'opérateur dépose ses fichiers en PUT direct sur
 * R2. Supabase Storage l'autorisait d'office, R2 non : sans cette règle,
 * tout envoi échoue dans le navigateur avant même de partir.
 * Origines lues dans R2_CORS_ORIGINS (séparées par des virgules), sinon
 * NEXT_PUBLIC_APP_URL + localhost.
 *
 * Ce que l'API S3 ne sait pas faire, à régler dans le tableau de bord
 * Cloudflare (rappelé en fin de script) : le domaine public du bucket previews.
 */

async function main(): Promise<void> {
  const { CreateBucketCommand, HeadBucketCommand, PutBucketCorsCommand } = await import("@aws-sdk/client-s3");
  const { ORIGINALS_BUCKET, PREVIEWS_BUCKET, storageClient } = await import("../lib/storage");
  const r2 = storageClient();

  async function ensureBucket(name: string): Promise<void> {
    try {
      await r2.send(new HeadBucketCommand({ Bucket: name }));
      console.log(`[setup-storage] bucket "${name}" déjà présent`);
      return;
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status !== 404) throw error;
    }
    await r2.send(new CreateBucketCommand({ Bucket: name }));
    console.log(`[setup-storage] bucket "${name}" créé`);
  }

  await ensureBucket(ORIGINALS_BUCKET);
  await ensureBucket(PREVIEWS_BUCKET);

  const origins = (process.env.R2_CORS_ORIGINS ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""},http://localhost:3000`)
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  await r2.send(
    new PutBucketCorsCommand({
      Bucket: ORIGINALS_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origins,
            AllowedMethods: ["PUT", "GET", "HEAD"],
            AllowedHeaders: ["content-type", "content-length"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
  console.log(`[setup-storage] CORS de "${ORIGINALS_BUCKET}" : ${origins.join(", ")}`);

  console.log(
    `\nÀ faire une fois dans le tableau de bord Cloudflare :\n` +
      `  1. R2, bucket "${PREVIEWS_BUCKET}", Settings, Custom Domains : rattacher media.linktrip.co,\n` +
      `     puis mettre https://media.linktrip.co dans R2_PREVIEWS_PUBLIC_URL.\n` +
      `  2. Bucket "${ORIGINALS_BUCKET}" : le laisser privé, les originaux ne sortent que par lien signé.\n` +
      `  3. Ne PAS activer l'accès public r2.dev : limité en débit, réservé aux essais.\n`,
  );
}

main().catch((error) => {
  console.error("[setup-storage] échec", error);
  process.exit(1);
});
