import "dotenv/config";
import { supabaseAdmin, ORIGINALS_BUCKET, PREVIEWS_BUCKET } from "../lib/supabase.js";

async function ensureBucket(name: string, isPublic: boolean): Promise<void> {
  const { data: existing, error: listError } = await supabaseAdmin.storage.getBucket(name);

  if (existing) {
    console.log(`[setup-storage] bucket "${name}" already exists (public=${existing.public})`);
    return;
  }

  if (listError && listError.message && !listError.message.toLowerCase().includes("not found")) {
    throw listError;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(name, { public: isPublic });
  if (createError) throw createError;

  console.log(`[setup-storage] created bucket "${name}" (public=${isPublic})`);
}

async function main(): Promise<void> {
  await ensureBucket(ORIGINALS_BUCKET, false);
  await ensureBucket(PREVIEWS_BUCKET, true);
  console.log("[setup-storage] done");
}

main().catch((error) => {
  console.error("[setup-storage] failed", error);
  process.exit(1);
});
