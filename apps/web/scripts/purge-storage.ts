import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

/**
 * Ménage du stockage (Cloudflare R2, lib/storage.ts), et mesure de la place
 * réellement occupée face au plafond gratuit (lib/storage-quota.ts).
 *
 * Trois modes :
 *   --orphelins  (défaut) ne supprime que ce qui n'est plus référencé par
 *                aucune ligne Photo : envois abandonnés, fiches supprimées
 *                par cascade. Aucune galerie vivante touchée.
 *   --tout       vide les deux buckets et la table Photo. Logos et
 *                couvertures d'opérateur (previews/logos/, previews/covers/)
 *                sont TOUJOURS préservés.
 *   --dry-run    n'écrit rien, affiche ce qui serait supprimé et la place
 *                occupée. Se combine avec les deux autres.
 *
 * Usage : pnpm --filter @souvenir/web purge:storage -- --dry-run
 */

type Mode = "orphelins" | "tout";

function parseArgs(): { mode: Mode; dryRun: boolean } {
  const args = process.argv.slice(2);
  return {
    mode: args.includes("--tout") ? "tout" : "orphelins",
    dryRun: args.includes("--dry-run"),
  };
}

function go(bytes: number): string {
  return `${(bytes / 1e9).toFixed(2)} Go`;
}

async function main() {
  const { mode, dryRun } = parseArgs();
  const { prisma } = await import("@souvenir/db");
  const { ORIGINALS_BUCKET, PREVIEWS_BUCKET, listObjects, deleteStorageObjects } = await import("../lib/storage");
  const { QUOTA_BYTES, storageUsedBytes } = await import("../lib/storage-quota");

  console.log(`Mode : ${mode}${dryRun ? " (dry-run, rien ne sera supprimé)" : ""}\n`);

  const photos = await prisma.photo.findMany({
    select: {
      originalKey: true,
      posterKey: true,
      previewKey: true,
      thumbKey: true,
      blurEmailKey: true,
      groupPreviewKey: true,
    },
  });
  const referenced = new Set<string>();
  for (const p of photos) {
    for (const key of [p.originalKey, p.posterKey, p.previewKey, p.thumbKey, p.blurEmailKey, p.groupPreviewKey]) {
      if (key) referenced.add(key);
    }
  }
  console.log(`${photos.length} lignes Photo, ${referenced.size} clés référencées.`);

  let total = 0;
  let occupied = 0;
  for (const bucket of [ORIGINALS_BUCKET, PREVIEWS_BUCKET]) {
    const objects = await listObjects(bucket);
    const bytes = objects.reduce((sum, o) => sum + o.size, 0);
    occupied += bytes;
    const aSupprimer = objects
      .map((o) => o.key)
      .filter((key) => {
        // Logos et couvertures d'opérateur ne sont rattachés à aucune Photo :
        // ne jamais les emporter dans le ménage.
        if (key.startsWith("logos/") || key.startsWith("covers/")) return false;
        if (mode === "tout") return true;
        return !referenced.has(key);
      });

    console.log(`\n${bucket} : ${objects.length} fichiers (${go(bytes)}), ${aSupprimer.length} à supprimer.`);
    total += aSupprimer.length;
    if (dryRun) {
      for (const key of aSupprimer.slice(0, 10)) console.log(`  · ${key}`);
      if (aSupprimer.length > 10) console.log(`  · … et ${aSupprimer.length - 10} autres`);
      continue;
    }
    await deleteStorageObjects(bucket, aSupprimer);
  }

  console.log(`\nPlace réelle : ${go(occupied)}. Compte du quota : ${go(await storageUsedBytes())} sur ${go(QUOTA_BYTES)} autorisés (offre gratuite R2 : 10 Go).`);

  if (mode === "tout" && !dryRun) {
    const { count } = await prisma.photo.deleteMany({});
    console.log(`\n${count} lignes Photo supprimées.`);
  }

  console.log(`\nTerminé, ${total} fichiers${dryRun ? " seraient supprimés" : " supprimés"}.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
