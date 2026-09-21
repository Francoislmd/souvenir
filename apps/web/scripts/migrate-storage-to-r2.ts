import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

/**
 * Recopie les fichiers de Supabase Storage vers Cloudflare R2, une fois, au
 * passage à R2 (21/09/2026). Rejouable : ce qui est déjà dans R2 est sauté.
 *
 *   pnpm --filter @souvenir/web storage:migrate -- --dry-run
 *   pnpm --filter @souvenir/web storage:migrate
 *
 * Ce qu'il fait :
 * 1. ne recopie que ce qui sert encore : les fichiers d'une ligne Photo, plus
 *    les logos et couvertures d'opérateur. Les orphelins restent chez Supabase ;
 * 2. refuse de partir si le total dépasse le plafond gratuit
 *    (lib/storage-quota.ts) : lancer d'abord purge des sorties périmées ;
 * 3. renseigne Photo.sizeBytes, base du quota, pour les fiches d'avant ;
 * 4. réécrit Operator.logoUrl et coverUrl, qui stockent une URL absolue
 *    vers l'ancien domaine Supabase.
 *
 * Les buckets Supabase ne sont pas vidés : à faire à la main une fois la
 * production vérifiée sur R2.
 */

const CONCURRENCY = 4;

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const { createClient } = await import("@supabase/supabase-js");
  const { prisma } = await import("@souvenir/db");
  const { ORIGINALS_BUCKET, PREVIEWS_BUCKET, getPreviewUrl, listObjects, uploadObject } = await import("../lib/storage");
  const { QUOTA_BYTES } = await import("../lib/storage-quota");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises");
  const { storage } = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Côté Supabase, les buckets s'appellent toujours originals et previews.
  const SOURCES = [
    { from: "originals", to: ORIGINALS_BUCKET },
    { from: "previews", to: PREVIEWS_BUCKET },
  ];

  async function listSupabase(bucket: string): Promise<Map<string, { size: number; type: string }>> {
    const out = new Map<string, { size: number; type: string }>();
    const stack = [""];
    while (stack.length > 0) {
      const dir = stack.pop()!;
      for (let offset = 0; ; ) {
        const { data, error } = await storage.from(bucket).list(dir, { limit: 1000, offset });
        if (error) throw error;
        if (!data || data.length === 0) break;
        for (const entry of data) {
          const full = dir ? `${dir}/${entry.name}` : entry.name;
          // Un dossier n'a pas d'id chez Supabase.
          if (entry.id === null) stack.push(full);
          else
            out.set(full, {
              size: Number((entry.metadata as { size?: number } | null)?.size ?? 0),
              type: String((entry.metadata as { mimetype?: string } | null)?.mimetype ?? "application/octet-stream"),
            });
        }
        if (data.length < 1000) break;
        offset += data.length;
      }
    }
    return out;
  }

  const photos = await prisma.photo.findMany({
    select: { id: true, originalKey: true, posterKey: true, previewKey: true, thumbKey: true, blurEmailKey: true, groupPreviewKey: true, sizeBytes: true },
  });
  const wanted = new Set<string>();
  for (const p of photos) {
    for (const k of [p.originalKey, p.posterKey, p.previewKey, p.thumbKey, p.blurEmailKey, p.groupPreviewKey]) if (k) wanted.add(k);
  }

  const plan: { from: string; to: string; key: string; size: number; type: string }[] = [];
  const sizes = new Map<string, number>();
  for (const { from, to } of SOURCES) {
    const source = await listSupabase(from);
    const already = new Set((await listObjects(to)).map((o) => o.key));
    source.forEach((meta, key) => {
      sizes.set(`${from}/${key}`, meta.size);
      const keep = wanted.has(key) || key.startsWith("logos/") || key.startsWith("covers/");
      if (keep && !already.has(key)) plan.push({ from, to, key, ...meta });
    });
    console.log(`${from} : ${source.size} fichiers chez Supabase, ${already.size} déjà dans R2.`);
  }

  const total = plan.reduce((sum, f) => sum + f.size, 0);
  console.log(`\n${plan.length} fichiers à recopier, ${(total / 1e9).toFixed(2)} Go (plafond gratuit : ${(QUOTA_BYTES / 1e9).toFixed(2)} Go).`);
  if (total > QUOTA_BYTES) {
    throw new Error("Trop gros pour l'offre gratuite : purger d'abord les sorties périmées (purge:storage), puis relancer.");
  }

  if (!dryRun) {
    let done = 0;
    let next = 0;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        while (next < plan.length) {
          const f = plan[next++]!;
          const { data, error } = await storage.from(f.from).download(f.key);
          if (error || !data) {
            console.error(`  échec ${f.from}/${f.key}`, error);
            continue;
          }
          await uploadObject(f.to, f.key, Buffer.from(await data.arrayBuffer()), { contentType: f.type });
          done += 1;
          if (done % 25 === 0 || done === plan.length) console.log(`  ${done}/${plan.length}`);
        }
      }),
    );
  }

  // Base du quota pour les fiches d'avant.
  const toSize = photos.filter((p) => p.sizeBytes == null);
  let sized = 0;
  for (const p of toSize) {
    const bytes = (sizes.get(`originals/${p.originalKey}`) ?? 0) + (p.posterKey ? (sizes.get(`originals/${p.posterKey}`) ?? 0) : 0);
    if (bytes <= 0) continue;
    if (!dryRun) await prisma.photo.update({ where: { id: p.id }, data: { sizeBytes: bytes } });
    sized += 1;
  }
  console.log(`\n${sized} fiches Photo reçoivent leur taille.`);

  // Logos et couvertures : URL absolue vers l'ancien domaine.
  const oldPrefix = `${url.replace(/\/$/, "")}/storage/v1/object/public/previews/`;
  const operators = await prisma.operator.findMany({ select: { id: true, logoUrl: true, coverUrl: true } });
  let rewritten = 0;
  for (const o of operators) {
    const data: { logoUrl?: string; coverUrl?: string } = {};
    if (o.logoUrl?.startsWith(oldPrefix)) data.logoUrl = getPreviewUrl(o.logoUrl.slice(oldPrefix.length));
    if (o.coverUrl?.startsWith(oldPrefix)) data.coverUrl = getPreviewUrl(o.coverUrl.slice(oldPrefix.length));
    if (Object.keys(data).length === 0) continue;
    if (!dryRun) await prisma.operator.update({ where: { id: o.id }, data });
    rewritten += 1;
  }
  console.log(`${rewritten} opérateurs : logo ou couverture réécrits vers R2.`);
  console.log(dryRun ? "\n--dry-run : rien n'a été écrit." : "\nTerminé.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
