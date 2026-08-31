import "dotenv/config";
import { CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../env.js";
import { ORIGINALS_BUCKET, PREVIEWS_BUCKET } from "../lib/storage.js";

/**
 * Crée les deux buckets R2 s'ils n'existent pas.
 *
 * L'accès public du bucket previews ne se règle PAS ici : c'est un réglage
 * Cloudflare (R2 > le bucket > Settings > Public access), pas une opération de
 * l'API S3. Sans lui, aucune galerie n'affichera d'aperçu — d'où le rappel en
 * fin de script.
 */

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

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

async function main(): Promise<void> {
  await ensureBucket(ORIGINALS_BUCKET);
  await ensureBucket(PREVIEWS_BUCKET);
  console.log("[setup-storage] terminé");
  console.log(
    `\nÀ faire une fois dans le tableau de bord Cloudflare :\n` +
      `  · bucket "${PREVIEWS_BUCKET}" → Settings → Public access → rattacher un domaine\n` +
      `    (ex. images.linktrip.co), puis reporter cette URL dans R2_PREVIEWS_PUBLIC_URL.\n` +
      `  · bucket "${ORIGINALS_BUCKET}" → laisser privé : les originaux ne sortent que par lien signé.\n`,
  );
}

main().catch((error) => {
  console.error("[setup-storage] échec", error);
  process.exit(1);
});
