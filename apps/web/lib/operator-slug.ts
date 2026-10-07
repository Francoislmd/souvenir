import { prisma } from "@/lib/prisma";
import { RESERVED_SLUGS } from "@/lib/store";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

/**
 * L'adresse de la page d'un pro (store.linktrip.co/{slug}) tirée de son nom,
 * libre et hors des chemins réservés. `operatorId` : la structure qu'on
 * renomme, dont l'adresse actuelle ne compte pas comme prise.
 *
 * RESERVED_SLUGS existait mais n'était appliqué nulle part : un prestataire
 * nommé « Api » obtenait le slug `api`, que middleware.ts laisse passer sans
 * réécriture — sa boutique était inaccessible, sans le moindre message.
 */
export async function uniqueOperatorSlug(name: string, operatorId?: string): Promise<string> {
  const base = slugify(name) || "activite";
  let slug = RESERVED_SLUGS.has(base) ? `${base}-1` : base;
  let suffix = 1;
  for (;;) {
    const taken = await prisma.operator.findUnique({ where: { slug }, select: { id: true } });
    if (!taken || taken.id === operatorId) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}
