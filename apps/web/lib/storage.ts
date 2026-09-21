import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

/**
 * Seule couture vers le stockage de fichiers : rien d'autre dans l'app ne
 * parle au fournisseur. Cloudflare R2 depuis le 21/09/2026 (Supabase Storage
 * avant) : téléchargements gratuits sans limite, 5 Go par envoi, et un
 * stockage plein ne peut plus couper l'authentification comme le 31/08.
 *
 * On reste dans l'offre gratuite de R2 (10 Go) grâce à lib/storage-quota.ts,
 * qui refuse un dépôt avant qu'il ne fasse dépasser le plafond.
 */

export const ORIGINALS_BUCKET = env.R2_BUCKET_ORIGINALS;
export const PREVIEWS_BUCKET = env.R2_BUCKET_PREVIEWS;

const HD_SIGNED_URL_TTL_SEC = 60 * 60 * 24; // 24 h
const UPLOAD_SIGNED_URL_TTL_SEC = 60 * 60 * 6; // une carte mémoire entière, sur une connexion lente
const DELETE_BATCH = 1000; // plafond de DeleteObjects

const r2 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: !!env.R2_ENDPOINT,
  // Depuis la 3.729, le SDK ajoute par défaut une somme de contrôle CRC32 aux
  // envois, y compris dans les URL signées : le navigateur ne peut pas la
  // calculer et R2 refuse alors le PUT. Seulement quand l'API l'exige.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

/** URL publique d'un aperçu : le bucket previews est servi par un domaine Cloudflare (cache compris). */
export function getPreviewUrl(key: string): string {
  return `${env.R2_PREVIEWS_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}

/**
 * Lien signé vers un original, le seul chemin vers un fichier acheté.
 * `downloadName` : le navigateur l'enregistre au lieu de l'afficher. Il faut
 * un lien à part : ajouter un paramètre à une URL signée casse sa signature
 * (l'ancien `&download=` de Supabase ne marche plus).
 */
export async function getOriginalSignedUrl(key: string, downloadName?: string): Promise<string | null> {
  try {
    return await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: ORIGINALS_BUCKET,
        Key: key,
        ...(downloadName
          ? { ResponseContentDisposition: `attachment; filename="${downloadName.replace(/[^\w.-]/g, "_")}"` }
          : {}),
      }),
      { expiresIn: HD_SIGNED_URL_TTL_SEC },
    );
  } catch (error) {
    console.error("[storage] signed URL failed", { key, error });
    return null;
  }
}

/**
 * URL d'envoi signée : le navigateur y dépose le fichier en PUT direct.
 * La taille est signée : un fichier d'une autre taille que celle déclarée
 * (et comptée par le quota) est refusé par R2 lui-même. Le Content-Type, lui,
 * ne l'est pas, pour ne pas échouer sur ce que devine le navigateur.
 */
export async function createSignedUploadUrl(bucket: string, key: string, contentLength: number): Promise<string> {
  return getSignedUrl(r2, new PutObjectCommand({ Bucket: bucket, Key: key, ContentLength: contentLength }), {
    expiresIn: UPLOAD_SIGNED_URL_TTL_SEC,
    signableHeaders: new Set(["content-length"]),
  });
}

export async function uploadObject(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array,
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
 * Télécharge un original en mémoire, pour le zip (app/api/g/[token]/zip).
 * L'appelant ne doit jamais en garder plus d'un à la fois en mémoire.
 */
export async function downloadOriginal(key: string): Promise<Uint8Array | null> {
  try {
    return await downloadObject(ORIGINALS_BUCKET, key);
  } catch (error) {
    console.error("[storage] download failed", { key, error });
    return null;
  }
}

/** Suppression par lots de 1000, tolérante aux clés absentes : les purges RGPD sont rejouables. */
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

/** Tout un bucket, pagination comprise, avec la taille de chaque objet (scripts de ménage et de mesure). */
export async function listObjects(bucket: string, prefix?: string): Promise<{ key: string; size: number }[]> {
  const out: { key: string; size: number }[] = [];
  let token: string | undefined;
  do {
    const page = await r2.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token, MaxKeys: 1000 }));
    for (const object of page.Contents ?? []) {
      if (object.Key) out.push({ key: object.Key, size: object.Size ?? 0 });
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return out;
}

/** Le client S3, pour les scripts d'installation (buckets, CORS) uniquement. */
export function storageClient(): S3Client {
  return r2;
}
