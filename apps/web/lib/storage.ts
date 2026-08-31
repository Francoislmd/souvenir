import { DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

/**
 * Seule couture vers le stockage de fichiers. Rien d'autre dans l'app ne parle
 * au fournisseur directement — c'est ce qui a permis de passer de Supabase
 * Storage à Cloudflare R2 sans toucher à la logique métier.
 *
 * Pourquoi R2 plutôt que Supabase Storage (31/08/2026) : l'egress y est
 * gratuit, alors qu'il est facturé 0,09 $/Go au-delà de 250 Go chez Supabase —
 * or ce produit fait télécharger des originaux, l'egress croît donc avec le
 * chiffre d'affaires. Et surtout : le stockage ne partage plus son quota avec
 * l'authentification. Le 31/08/2026, un bucket qui débordait a coupé la
 * connexion de tous les opérateurs pendant des heures ; ça ne peut plus
 * arriver, Supabase ne garde que Postgres et l'auth.
 */

export const ORIGINALS_BUCKET = env.R2_BUCKET_ORIGINALS;
export const PREVIEWS_BUCKET = env.R2_BUCKET_PREVIEWS;

const HD_SIGNED_URL_TTL_SEC = 60 * 60 * 24; // 24h
const UPLOAD_SIGNED_URL_TTL_SEC = 60 * 60; // 1h — le dépôt d'une sortie complète
const DELETE_BATCH = 1000; // plafond de l'API S3 DeleteObjects

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * URL publique d'un aperçu. Le bucket previews est servi par un domaine
 * Cloudflare (R2_PREVIEWS_PUBLIC_URL) : egress gratuit et CDN au passage.
 */
export function getPreviewUrl(key: string): string {
  return `${env.R2_PREVIEWS_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}

/** Lien signé vers l'original — le seul chemin vers un fichier acheté. */
export async function getOriginalSignedUrl(key: string): Promise<string | null> {
  try {
    return await getSignedUrl(r2, new GetObjectCommand({ Bucket: ORIGINALS_BUCKET, Key: key }), {
      expiresIn: HD_SIGNED_URL_TTL_SEC,
    });
  } catch (error) {
    console.error("[storage] signed URL failed", { key, error });
    return null;
  }
}

/**
 * URL d'envoi signée — le navigateur y dépose le fichier en PUT direct, sans
 * transiter par le serveur. Le Content-Type n'est volontairement pas signé :
 * le client envoie celui du fichier, et l'exiger ferait échouer l'envoi au
 * moindre écart entre ce que devine le navigateur et ce qu'on aurait prévu.
 */
export async function createSignedUploadUrl(bucket: string, key: string): Promise<string> {
  return getSignedUrl(r2, new PutObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: UPLOAD_SIGNED_URL_TTL_SEC,
  });
}

export async function uploadObject(
  bucket: string,
  key: string,
  body: Buffer,
  { contentType, cacheControl }: { contentType: string; cacheControl?: string },
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ...(cacheControl ? { CacheControl: cacheControl } : {}),
    }),
  );
}

export async function downloadObject(bucket: string, key: string): Promise<Buffer> {
  const { Body } = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!Body) throw new Error(`[storage] ${bucket}/${key} : réponse sans corps`);
  return Buffer.from(await Body.transformToByteArray());
}

/**
 * Suppression par lots de 1000 (plafond de l'API S3). Tolérant aux clés
 * absentes : S3 ne considère pas comme une erreur la suppression d'un objet
 * qui n'existe plus, ce qui rend les purges RGPD rejouables sans risque.
 */
export async function deleteStorageObjects(bucket: string, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  for (let i = 0; i < keys.length; i += DELETE_BATCH) {
    const lot = keys.slice(i, i + DELETE_BATCH);
    const { Errors } = await r2.send(
      new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: lot.map((Key) => ({ Key })), Quiet: true } }),
    );
    if (Errors && Errors.length > 0) {
      console.error("[storage] suppressions en échec", { bucket, errors: Errors.slice(0, 5) });
    }
  }
}

/** Parcourt tout un bucket, pagination comprise. Utilisé par scripts/purge-storage.ts. */
export async function listObjectKeys(bucket: string, prefix?: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const page = await r2.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token, MaxKeys: 1000 }),
    );
    for (const object of page.Contents ?? []) {
      if (object.Key) keys.push(object.Key);
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return keys;
}
