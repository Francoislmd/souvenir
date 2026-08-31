import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../env.js";

/**
 * Accès au stockage côté worker. Volontairement dupliqué depuis
 * apps/web/lib/storage.ts plutôt que partagé : le monorepo est verrouillé sur
 * trois espaces (web, worker, packages/db) et un paquet de plus pour cinquante
 * lignes ne vaut pas la dette de structure. Le worker n'a besoin que de lire un
 * original et d'écrire des aperçus — pas d'URL signée, pas de suppression.
 */

export const ORIGINALS_BUCKET = env.R2_BUCKET_ORIGINALS;
export const PREVIEWS_BUCKET = env.R2_BUCKET_PREVIEWS;

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export async function downloadObject(bucket: string, key: string): Promise<Buffer> {
  const { Body } = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!Body) throw new Error(`[storage] ${bucket}/${key} : réponse sans corps`);
  return Buffer.from(await Body.transformToByteArray());
}

export async function uploadObject(bucket: string, key: string, body: Buffer, contentType: string): Promise<void> {
  await r2.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}
