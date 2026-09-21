import exifr from "exifr";
import { prisma } from "./prisma";
import { track } from "./analytics";
import { ORIGINALS_BUCKET, PREVIEWS_BUCKET, downloadObject, uploadObject } from "./storage";
import { generateGroupPreview } from "./group-watermark";
import { clusterByTime, type ClusterItem } from "./cluster";
import { imageSourceKeyOf } from "./media";

const DAY_MS = 24 * 60 * 60 * 1000;

// Toujours formaté en heure de Paris (le seul fuseau du marché actuel) :
// sans ça, l'heure affichée dépend du fuseau du serveur qui exécute la
// publication (souvent UTC en production) et ne correspond plus à l'heure
// que l'opérateur a saisie à la création de la sortie.
function formatSlotLabel(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " h ");
}

interface PhotoPrep {
  id: string;
  takenAt: Date | null;
  groupPreviewKey: string | null;
}

const parisDayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
function isSameParisDay(a: Date, b: Date): boolean {
  return parisDayFormatter.format(a) === parisDayFormatter.format(b);
}

// Le filigrane tourne désormais un modèle de détection de visage (TF.js,
// backend CPU) en plus du rendu canvas — bien plus lourd en CPU/mémoire que
// l'ancien rendu SVG. Lancer une dizaine de préparations de front sur une
// même invocation (Promise.all sans limite) s'est déjà traduit par des
// aperçus silencieusement manquants sur une grosse sortie, sans la moindre
// erreur dans les logs — signe de contention plutôt que d'échec propre.
// On plafonne donc le nombre de photos traitées en parallèle.
// 6 depuis le 19/09/2026 : la détection de visage (TF.js) qui justifiait 3 a
// été retirée le 12/09, il ne reste que sharp + canvas. Et la publication ne
// prépare plus que les photos dont le dépôt n'a pas déjà posé l'aperçu.
const PREPARE_CONCURRENCY = 6;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Télécharge l'original et génère+stocke son aperçu filigrané de galerie
 * de groupe (lib/group-watermark.ts) — jamais servi flouté, la protection
 * tient entièrement au filigrane. Partagé entre la publication initiale
 * (preparePhotoOnce, qui lit aussi l'EXIF sur le même buffer) et le
 * rattrapage silencieux (regenerateGroupPreview, backfillGroupPreviews).
 */
async function uploadGroupPreview(photoId: string, buffer: Buffer, operatorName: string): Promise<string> {
  const groupPreviewKey = `${photoId}/group-preview.jpg`;
  const previewBuffer = await generateGroupPreview(buffer, operatorName);
  // cacheControl court (et non l'heure par défaut de Supabase) : cette clé
  // peut être réécrite en place (upsert) si la sortie est republiée ou
  // qu'un correctif du filigrane est déployé — sans ça, le CDN/le
  // navigateur continue de servir l'ancien contenu pendant jusqu'à une
  // heure après la mise à jour, ce qui a déjà semé la confusion (aperçus
  // qui "ne changent pas" ou parlant les uns des autres après un correctif).
  await uploadObject(PREVIEWS_BUCKET, groupPreviewKey, previewBuffer, { contentType: "image/jpeg", cacheControl: "public, max-age=60" });
  return groupPreviewKey;
}

/**
 * Un seul téléchargement de l'original par photo : sert à la fois à lire
 * l'EXIF (regroupement par créneau) et à générer l'aperçu filigrané de
 * galerie de groupe (lib/group-watermark.ts) — jamais servi flouté, la
 * protection tient entièrement au filigrane.
 */
async function preparePhotoOnce(photoId: string, originalKey: string, operatorName: string): Promise<PhotoPrep> {
  const buffer = await downloadObject(ORIGINALS_BUCKET, originalKey);

  const exif = await exifr.parse(buffer, ["DateTimeOriginal"]).catch(() => null);
  const takenAtRaw = exif?.DateTimeOriginal;
  const takenAt = takenAtRaw instanceof Date && !Number.isNaN(takenAtRaw.getTime()) ? takenAtRaw : null;

  const groupPreviewKey = await uploadGroupPreview(photoId, buffer, operatorName);

  return { id: photoId, takenAt, groupPreviewKey };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Délais entre essais (ms) — pas un retry immédiat. Cas vu en pratique :
// l'opérateur publie quelques secondes après avoir déposé les photos, et le
// stockage renvoie "Object not found" sur un original pourtant bien
// uploadé (juste pas encore répliqué/lisible partout) : sur une sortie de
// 14 photos, 10 ont échoué ainsi avec un seul essai immédiat, alors que le
// fichier existait bel et bien une poignée de secondes plus tard.
const RETRY_DELAYS_MS = [1000, 2000, 4000];

/**
 * Un seul téléchargement de l'original par photo : sert à la fois à lire
 * l'EXIF (regroupement par créneau) et à générer l'aperçu filigrané de
 * galerie de groupe (lib/group-watermark.ts) — jamais servi flouté, la
 * protection tient entièrement au filigrane. Plusieurs essais espacés avant
 * d'abandonner : le rendu sollicite fortement le CPU (détection de visage
 * TF.js, contention possible), et un original tout juste uploadé peut
 * renvoyer "Object not found" le temps d'être répliqué côté stockage.
 */
async function preparePhoto(photoId: string, originalKey: string, operatorName: string): Promise<PhotoPrep> {
  const maxAttempts = RETRY_DELAYS_MS.length + 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await preparePhotoOnce(photoId, originalKey, operatorName);
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error(`[group-publish] preparation failed for ${originalKey}`, error);
        return { id: photoId, takenAt: null, groupPreviewKey: null };
      }
      const delay = RETRY_DELAYS_MS[attempt - 1]!;
      console.warn(`[group-publish] preparation attempt ${attempt} failed for ${originalKey}, retrying in ${delay}ms`, error);
      await sleep(delay);
    }
  }
  // Inatteignable (la boucle retourne toujours dans l'une des deux branches ci-dessus).
  return { id: photoId, takenAt: null, groupPreviewKey: null };
}

/**
 * Rattrapage d'une photo dont l'aperçu filigrané a échoué à la publication
 * (voir preparePhoto) — un seul essai, pas de retry avec backoff ici : ce
 * sont les rappels successifs du client toutes les 4s (voir GroupGallery,
 * getSlotPhotos) qui font office de nouvelles tentatives. gallery-group.ts
 * ne sert plus jamais previewKey/thumbKey en repli quand groupPreviewKey
 * est absent — sans ce rattrapage, une photo restée en échec resterait
 * invisible pour toujours.
 */
export async function regenerateGroupPreview(photoId: string, originalKey: string, operatorName: string): Promise<string | null> {
  try {
    const buffer = await downloadObject(ORIGINALS_BUCKET, originalKey);
    return await uploadGroupPreview(photoId, buffer, operatorName);
  } catch (error) {
    console.error(`[group-publish] backfill preview failed for ${originalKey}`, error);
    return null;
  }
}

/**
 * Retente en arrière-plan l'aperçu filigrané de chaque photo fournie
 * (originalKey) et persiste les clés obtenues. Même limite de concurrence
 * que la publication initiale — voir PREPARE_CONCURRENCY.
 */
export async function backfillGroupPreviews(photos: { id: string; originalKey: string }[], operatorName: string): Promise<Map<string, string>> {
  if (photos.length === 0) return new Map();

  const results = await mapWithConcurrency(photos, PREPARE_CONCURRENCY, async (photo) => ({
    id: photo.id,
    key: await regenerateGroupPreview(photo.id, photo.originalKey, operatorName),
  }));

  const updates = results.filter((r): r is { id: string; key: string } => r.key !== null);
  await Promise.all(updates.map((u) => prisma.photo.update({ where: { id: u.id }, data: { groupPreviewKey: u.key } })));

  return new Map(updates.map((u) => [u.id, u.key]));
}

/** Ce que l'écran de l'opérateur suit pendant la publication : rien de
 *  simulé, chaque photo est annoncée au moment où son aperçu est posé. */
export interface PublishProgress {
  onStart?: (total: number) => void;
  onPhoto?: (photoId: string, done: number, total: number) => void;
  onSorting?: () => void;
}

/**
 * Publie une sortie GROUPE : lit l'EXIF de chaque original, génère son
 * aperçu filigrané, regroupe les photos par créneau (lib/cluster.ts), crée
 * les Slot, désigne une couverture par créneau (juste une vignette de
 * repérage — pas une photo offerte, elle reste payante comme les autres),
 * et publie le lien. Tourne en ligne dans la requête (même modèle que
 * lib/photo-processing.ts — voir CLAUDE.md §2 : pas de worker séparé).
 */
export async function publishGroupSortie(sortieId: string, progress: PublishProgress = {}): Promise<void> {
  const sortie = await prisma.sortie.findUniqueOrThrow({
    where: { id: sortieId },
    include: {
      operator: true,
      photos: { where: { status: { not: "FAILED" } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (sortie.mode !== "GROUPE") throw new Error("publishGroupSortie: sortie is not in GROUPE mode");

  // Depuis le 19/09/2026, le dépôt (lib/photo-processing.ts) pose l'aperçu
  // filigrané et lit l'heure de prise de vue : une photo qui a son aperçu n'a
  // plus rien à préparer, publier revient à la ranger. Seules les photos
  // déposées avant ce changement, ou dont le rendu a échoué au dépôt, sont
  // retéléchargées ici — et une republication ne refait que les nouvelles.
  const total = sortie.photos.length;
  let done = 0;
  progress.onStart?.(total);
  const alreadyReady = sortie.photos.filter((photo) => photo.groupPreviewKey);
  const toPrepare = sortie.photos.filter((photo) => !photo.groupPreviewKey);
  for (const photo of alreadyReady) {
    done += 1;
    progress.onPhoto?.(photo.id, done, total);
  }
  const freshlyPrepared = await mapWithConcurrency(toPrepare, PREPARE_CONCURRENCY, async (photo) => {
    // Vidéo : l'aperçu part de sa vignette, jamais du fichier vidéo (lib/media.ts).
    const prepared = await preparePhoto(photo.id, imageSourceKeyOf(photo), sortie.operator.name);
    done += 1;
    progress.onPhoto?.(photo.id, done, total);
    return prepared;
  });
  const freshIds = new Set(toPrepare.map((photo) => photo.id));
  // Dans l'ordre de dépôt, comme avant : la couverture d'un créneau sans
  // heure de prise de vue est sa première photo.
  const byId = new Map<string, PhotoPrep>(freshlyPrepared.map((p) => [p.id, p]));
  // Une heure déjà connue n'est jamais effacée par une préparation qui n'en
  // trouve pas : c'est le cas de toute vidéo (sa vignette n'a pas d'EXIF,
  // l'heure a été lue au dépôt), et d'une photo dont l'EXIF est illisible au
  // second passage.
  const preparedRaw: PhotoPrep[] = sortie.photos.map((photo) => {
    const fresh = byId.get(photo.id);
    return fresh
      ? { ...fresh, takenAt: fresh.takenAt ?? photo.takenAt, groupPreviewKey: fresh.groupPreviewKey ?? photo.groupPreviewKey }
      : { id: photo.id, takenAt: photo.takenAt, groupPreviewKey: photo.groupPreviewKey };
  });
  progress.onSorting?.();
  // L'EXIF n'est fiable que si elle tombe le même jour (heure de Paris) que
  // la date renseignée par l'opérateur pour la sortie — sinon on l'ignore
  // plutôt que de lui faire confiance aveuglément. Cas vus en pratique :
  // photos de test/captures d'écran sans rapport, photos ré-uploadées d'une
  // autre sortie, horloge d'appareil mal réglée. Sans ce garde-fou, une
  // seule photo à l'EXIF aberrant peut (a) afficher un horaire de créneau
  // sans rapport avec la sortie, et (b) entrer en collision avec le repli
  // "sans EXIF" des autres photos si leur tuilage retombe sur cette même
  // date par coïncidence — créant un faux créneau distinct pour ce qui
  // n'est qu'une erreur de métadonnées.
  const prepared = preparedRaw.map((p) => (p.takenAt && !isSameParisDay(p.takenAt, sortie.startsAt) ? { ...p, takenAt: null } : p));
  const items: ClusterItem[] = prepared.map((p) => ({ id: p.id, takenAt: p.takenAt }));
  const clusters = clusterByTime(items, undefined, sortie.startsAt);

  await prisma.$transaction(async (tx) => {
    // Republier (photos ajoutées après coup, ou nouvelle tentative) doit
    // repartir d'une ardoise propre : sans ça, les anciens Slot d'une
    // publication précédente restent en base à côté des nouveaux — déjà vu
    // produire deux Slot distincts coïncidant sur le même horaire de repli.
    // La suppression met simplement Photo.slotId à null (onDelete: SetNull),
    // aussitôt réassigné ci-dessous.
    await tx.slot.deleteMany({ where: { sortieId: sortie.id } });

    for (const cluster of clusters) {
      const slot = await tx.slot.create({
        data: {
          sortieId: sortie.id,
          label: formatSlotLabel(cluster.startsAt),
          startsAt: cluster.startsAt,
          guide: sortie.guide,
        },
      });

      await tx.photo.updateMany({ where: { id: { in: cluster.ids } }, data: { slotId: slot.id } });

      const [coverPhotoId] = cluster.ids;
      if (coverPhotoId) {
        await tx.slot.update({ where: { id: slot.id }, data: { coverPhotoId } });
      }
    }

    // takenAt et groupPreviewKey sont renseignés sur chaque photo préparée
    // ici, indépendamment du slot. Celles déjà prêtes au dépôt ont les leurs
    // en base : les réécrire coûterait un aller-retour par photo dans la
    // transaction pour rien.
    await Promise.all(
      prepared
        .filter((p) => freshIds.has(p.id) && (p.takenAt || p.groupPreviewKey))
        .map((p) => tx.photo.update({ where: { id: p.id }, data: { takenAt: p.takenAt, groupPreviewKey: p.groupPreviewKey } })),
    );

    await tx.sortie.update({
      where: { id: sortie.id },
      data: { status: "SENT", purgeAt: new Date(sortie.startsAt.getTime() + 90 * DAY_MS) },
    });
  });

  await track("sortie_published", { operatorId: sortie.operatorId, meta: { sortieId: sortie.id, slots: clusters.length } });
}
