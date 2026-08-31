import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

/**
 * Ménage du stockage Supabase.
 *
 * Écrit après la panne du 31/08/2026 : le projet avait été restreint par
 * Supabase pour dépassement du quota de 1 Go, ce qui coupait aussi l'auth —
 * plus personne ne pouvait se connecter ni créer de compte.
 *
 * Trois modes :
 *   --orphelins  (défaut) ne supprime que ce qui n'est plus référencé par
 *                aucune ligne Photo, plus le dossier `zips/` (reliquat d'une
 *                fonctionnalité abandonnée). Aucune galerie vivante touchée.
 *   --tout       vide les deux buckets et la table Photo. Les logos
 *                d'opérateur (previews/logos/) sont TOUJOURS préservés.
 *   --dry-run    n'écrit rien, affiche seulement ce qui serait supprimé.
 *                Se combine avec les deux autres.
 *
 * Usage : pnpm --filter @souvenir/web purge:storage -- --dry-run
 *
 * Depuis la bascule vers R2, la suppression passe par l'API S3 (DeleteObjects,
 * par lots de 1000) via lib/storage.ts.
 */

type Mode = "orphelins" | "tout";

function parseArgs(): { mode: Mode; dryRun: boolean } {
  const args = process.argv.slice(2);
  return {
    mode: args.includes("--tout") ? "tout" : "orphelins",
    dryRun: args.includes("--dry-run"),
  };
}

async function main() {
  const { mode, dryRun } = parseArgs();
  const { prisma } = await import("@souvenir/db");
  const { deleteStorageObjects, listObjectKeys, ORIGINALS_BUCKET, PREVIEWS_BUCKET } = await import("../lib/storage");

  console.log(`Mode : ${mode}${dryRun ? " (dry-run, rien ne sera supprimé)" : ""}\n`);

  const photos = await prisma.photo.findMany({
    select: {
      originalKey: true,
      previewKey: true,
      thumbKey: true,
      blurKey: true,
      blurEmailKey: true,
      groupPreviewKey: true,
    },
  });
  const referenced = new Set<string>();
  for (const p of photos) {
    for (const key of [p.originalKey, p.previewKey, p.thumbKey, p.blurKey, p.blurEmailKey, p.groupPreviewKey]) {
      if (key) referenced.add(key);
    }
  }
  console.log(`${photos.length} lignes Photo, ${referenced.size} clés référencées.`);

  let total = 0;
  for (const bucket of [ORIGINALS_BUCKET, PREVIEWS_BUCKET]) {
    const keys = await listObjectKeys(bucket);
    const aSupprimer = keys.filter((key) => {
      // Les logos d'opérateur vivent dans previews/logos/ et ne sont jamais
      // rattachés à une Photo : ne jamais les emporter dans le ménage.
      if (key.startsWith("logos/")) return false;
      if (mode === "tout") return true;
      return !referenced.has(key) || key.startsWith("zips/");
    });

    console.log(`\n${bucket} : ${keys.length} fichiers, ${aSupprimer.length} à supprimer.`);
    total += aSupprimer.length;
    if (dryRun) {
      for (const key of aSupprimer.slice(0, 10)) console.log(`  · ${key}`);
      if (aSupprimer.length > 10) console.log(`  · … et ${aSupprimer.length - 10} autres`);
      continue;
    }

    await deleteStorageObjects(bucket, aSupprimer);
    console.log(`  ${aSupprimer.length} supprimés.`);
  }

  if (mode === "tout" && !dryRun) {
    const { count } = await prisma.photo.deleteMany({});
    console.log(`\n${count} lignes Photo supprimées.`);
  }

  console.log(`\nTerminé — ${total} fichiers${dryRun ? " seraient supprimés" : " supprimés"}.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
