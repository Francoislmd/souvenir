import "dotenv/config";
import { supabaseAdmin } from "../lib/supabase";
import { ORIGINALS_BUCKET, PREVIEWS_BUCKET } from "../lib/storage";

/**
 * Crée les deux buckets s'ils n'existent pas — geste d'installation, joué une
 * fois par environnement. Vivait dans apps/worker, supprimé depuis : le
 * traitement des photos tourne en ligne dans apps/web (CLAUDE.md §2).
 */
async function ensureBucket(name: string, isPublic: boolean): Promise<void> {
  const { data: existing, error: listError } = await supabaseAdmin.storage.getBucket(name);

  if (existing) {
    console.log(`[setup-storage] bucket "${name}" existe déjà (public=${existing.public})`);
    return;
  }

  if (listError && listError.message && !listError.message.toLowerCase().includes("not found")) {
    throw listError;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(name, { public: isPublic });
  if (createError) throw createError;

  console.log(`[setup-storage] bucket "${name}" créé (public=${isPublic})`);
}

async function main(): Promise<void> {
  await ensureBucket(ORIGINALS_BUCKET, false);
  await ensureBucket(PREVIEWS_BUCKET, true);
  console.log("[setup-storage] terminé");
}

main().catch((error) => {
  console.error("[setup-storage] échec", error);
  process.exit(1);
});
