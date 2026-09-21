import type { Prisma } from "@souvenir/db";
import { prisma } from "./prisma";
import { env } from "./env";

/**
 * Le garde-fou qui garde Linktrip dans l'offre gratuite de Cloudflare R2
 * (10 Go-mois de stockage, téléchargements gratuits sans limite).
 *
 * Cloudflare n'a pas de plafond de dépense : au-delà de 10 Go, il facture.
 * Le plafond est donc ici. Chaque fichier déposé est compté AVANT d'avoir son
 * URL d'envoi, et refusé s'il ferait dépasser STORAGE_QUOTA_GB (9 Go par
 * défaut). Tant que le total instantané reste sous 10 Go, la moyenne du mois
 * aussi : la facture reste à zéro.
 *
 * Ce qui rend le compte fiable :
 * - la taille déclarée est signée dans l'URL d'envoi (lib/storage.ts) : R2
 *   refuse un fichier d'une autre taille ;
 * - le contrôle et la création de la fiche se font sous un verrou Postgres :
 *   un lot de 200 photos enregistrées en parallèle ne peut pas passer à 200
 *   sur la même place libre ;
 * - les dérivées (miniature, aperçus, flou) sont comptées forfaitairement ;
 * - la purge à 90 jours (lib/gdpr.ts) supprime les fiches et libère la place.
 *
 * Les opérations (1 M écritures, 10 M lectures par mois gratuites) ne sont
 * pas plafonnées : une photo en coûte environ six en écriture, soit plus de
 * 150 000 photos par mois avant d'y toucher.
 */

export const QUOTA_BYTES = Math.round(env.STORAGE_QUOTA_GB * 1e9);
/** Miniature + aperçu + flou email + aperçu filigrané d'une photo, largement arrondis. */
export const DERIVATIVES_BYTES = 800_000;
/** Une fiche d'avant le compte (sizeBytes vide) : une photo de reflex, largement arrondie. */
const LEGACY_PHOTO_BYTES = 15_000_000;

type Db = Prisma.TransactionClient | typeof prisma;

export async function storageUsedBytes(db: Db = prisma): Promise<number> {
  const [counted, legacy] = await Promise.all([
    db.photo.aggregate({ where: { sizeBytes: { not: null } }, _sum: { sizeBytes: true }, _count: { _all: true } }),
    db.photo.count({ where: { sizeBytes: null } }),
  ]);
  return (counted._sum.sizeBytes ?? 0) + (counted._count._all + legacy) * DERIVATIVES_BYTES + legacy * LEGACY_PHOTO_BYTES;
}

export class StorageFullError extends Error {
  constructor(public readonly usedBytes: number) {
    super("storage_full");
  }
}

/**
 * Réserve la place d'un fichier et crée sa fiche dans la même transaction,
 * sous verrou. Lève StorageFullError si le plafond serait dépassé.
 */
export async function withStorageRoom<T>(bytes: number, create: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // 724301 : clé arbitraire, propre à ce verrou. Relâché à la fin de la transaction.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(724301)::text AS locked`;
    const used = await storageUsedBytes(tx);
    if (used + bytes + DERIVATIVES_BYTES > QUOTA_BYTES) throw new StorageFullError(used);
    return create(tx);
  });
}
