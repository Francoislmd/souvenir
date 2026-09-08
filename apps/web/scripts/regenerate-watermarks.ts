import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

/**
 * Régénère les aperçus filigranés existants.
 *
 * Pourquoi ce script existe : le filigrane est cuit dans un JPEG au moment
 * où la sortie est publiée, puis stocké (Photo.groupPreviewKey). Changer
 * lib/group-watermark.ts ne change donc RIEN aux photos déjà publiées —
 * elles gardent l'ancien filigrane pour toujours. Le rattrapage automatique
 * (backfillGroupPreviews) ne s'occupe que des photos dont l'aperçu MANQUE,
 * jamais de celles qui en ont déjà un.
 *
 * À lancer une fois après chaque changement de direction artistique du
 * filigrane, sinon seules les sorties publiées après le déploiement en
 * bénéficient.
 *
 *   pnpm --filter @souvenir/web watermarks:regenerate -- --dry-run
 *   pnpm --filter @souvenir/web watermarks:regenerate -- --operateur "Deeptown"
 *   pnpm --filter @souvenir/web watermarks:regenerate
 *
 * Options :
 *   --dry-run          n'écrit rien, dit seulement ce qui serait refait.
 *   --operateur <nom>  ne traite que cet opérateur (correspondance partielle,
 *                      insensible à la casse) — pratique pour vérifier le
 *                      rendu sur une seule structure avant de tout relancer.
 *   --limite <n>       s'arrête après n photos.
 *
 * Le travail est repris là où il s'arrête : chaque photo est réécrite sous
 * la même clé, donc relancer le script après une coupure est sans danger.
 * Une photo qui échoue est signalée et le script continue — mieux vaut 99
 * aperçus refaits qu'un arrêt au premier original illisible.
 */

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const operatorFilter = valueOf(args, "--operateur");
  const limit = Number(valueOf(args, "--limite") ?? "0") || Infinity;

  const { prisma } = await import("../lib/prisma");
  const { regenerateGroupPreview } = await import("../lib/group-publish");

  const photos = await prisma.photo.findMany({
    where: {
      groupPreviewKey: { not: null },
      status: { not: "FAILED" },
      ...(operatorFilter ? { sortie: { operator: { name: { contains: operatorFilter, mode: "insensitive" } } } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, originalKey: true, sortie: { select: { operator: { select: { name: true } } } } },
  });

  const todo = photos.slice(0, limit === Infinity ? undefined : limit);
  const byOperator = new Map<string, number>();
  for (const p of todo) {
    const name = p.sortie.operator.name;
    byOperator.set(name, (byOperator.get(name) ?? 0) + 1);
  }

  console.log(`${todo.length} aperçu(s) à régénérer${photos.length !== todo.length ? ` (sur ${photos.length})` : ""} :`);
  byOperator.forEach((count, name) => console.log(`  ${name} — ${count}`));

  if (dryRun) {
    console.log("\n--dry-run : rien n'a été écrit.");
    return;
  }
  if (todo.length === 0) return;

  let done = 0;
  let failed = 0;
  const started = Date.now();

  // En série, volontairement : la génération sollicite fortement le CPU
  // (détection de visages TF.js) et ce script tourne sur un poste, pas sur
  // une fonction. Rien ne presse, et rien ne doit tomber en route.
  for (const photo of todo) {
    const key = await regenerateGroupPreview(photo.id, photo.originalKey, photo.sortie.operator.name);
    if (key) {
      await prisma.photo.update({ where: { id: photo.id }, data: { groupPreviewKey: key } });
      done += 1;
    } else {
      failed += 1;
    }
    if ((done + failed) % 10 === 0 || done + failed === todo.length) {
      const seconds = Math.round((Date.now() - started) / 1000);
      console.log(`  ${done + failed}/${todo.length} — ${done} refaits, ${failed} en échec, ${seconds} s`);
    }
  }

  console.log(`\nTerminé : ${done} aperçu(s) refaits, ${failed} en échec.`);
}

function valueOf(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  });
