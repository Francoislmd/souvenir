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
 * Attention : la suppression passe par l'API Storage, seule voie qui efface
 * réellement les fichiers. Supprimer des lignes de `storage.objects` en SQL
 * est bloqué par un trigger Supabase (`protect_objects_delete`) et, même
 * contourné, ne libérerait pas l'espace physique.
 */

const BATCH = 100;
const ORIGINALS = "originals";
const PREVIEWS = "previews";

type Mode = "orphelins" | "tout";

function parseArgs(): { mode: Mode; dryRun: boolean } {
  const args = process.argv.slice(2);
  return {
    mode: args.includes("--tout") ? "tout" : "orphelins",
    dryRun: args.includes("--dry-run"),
  };
}

async function listAll(
  storage: ReturnType<typeof import("@supabase/supabase-js").createClient>["storage"],
  bucket: string,
  prefix = "",
): Promise<string[]> {
  const keys: string[] = [];
  const stack = [prefix];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let offset = 0;
    for (;;) {
      const { data, error } = await storage.from(bucket).list(dir, { limit: 1000, offset });
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const entry of data) {
        const full = dir ? `${dir}/${entry.name}` : entry.name;
        // Supabase distingue un dossier d'un fichier par l'absence de metadata.
        if (entry.id === null) stack.push(full);
        else keys.push(full);
      }
      if (data.length < 1000) break;
      offset += data.length;
    }
  }
  return keys;
}

async function main() {
  const { mode, dryRun } = parseArgs();
  const { createClient } = await import("@supabase/supabase-js");
  const { prisma } = await import("@souvenir/db");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises");
  }
  const { storage } = createClient(url, serviceKey);

  console.log(`Mode : ${mode}${dryRun ? " (dry-run, rien ne sera supprimé)" : ""}\n`);

  const photos = await prisma.photo.findMany({
    select: {
      originalKey: true,
      previewKey: true,
      thumbKey: true,
      blurEmailKey: true,
      groupPreviewKey: true,
    },
  });
  const referenced = new Set<string>();
  for (const p of photos) {
    for (const key of [p.originalKey, p.previewKey, p.thumbKey, p.blurEmailKey, p.groupPreviewKey]) {
      if (key) referenced.add(key);
    }
  }
  console.log(`${photos.length} lignes Photo, ${referenced.size} clés référencées.`);

  let total = 0;
  for (const bucket of [ORIGINALS, PREVIEWS]) {
    const keys = await listAll(storage, bucket);
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

    for (let i = 0; i < aSupprimer.length; i += BATCH) {
      const lot = aSupprimer.slice(i, i + BATCH);
      const { error } = await storage.from(bucket).remove(lot);
      if (error) throw error;
      console.log(`  ${Math.min(i + BATCH, aSupprimer.length)}/${aSupprimer.length}`);
    }
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
