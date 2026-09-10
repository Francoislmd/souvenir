import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * L'adresse publique d'une sortie de groupe : store.linktrip.co/{slug}/{code}.
 *
 * Le slug de l'opérateur est lisible et donc devinable, volontairement : c'est
 * une vitrine, elle porte sa marque. Le secret tient au code court, et sa
 * portée s'arrête à UNE sortie : quelqu'un qui devine le slug ne voit aucune
 * photo, et le code d'une sortie ne donne jamais accès à celles des autres
 * jours. C'est la différence avec l'ancien lien unique par opérateur, où un
 * seul jeton ouvrait 90 jours d'historique.
 */

// Alphabet sans caractère ambigu : ni i/l/1, ni o/0. Le code est lu à voix
// haute, recopié depuis un écran ou un ticket, parfois par quelqu'un qui sort
// de l'eau — chaque paire indistinguable coûte un client perdu.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 6;

// Réservés : ces segments ne doivent jamais être confondus avec un slug
// d'opérateur sur store.linktrip.co (voir middleware.ts).
export const RESERVED_SLUGS = new Set(["api", "_next", "s", "g", "store", "www", "admin", "favicon.ico", "robots.txt", "sitemap.xml"]);

function randomCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

/**
 * Le code n'est unique que par opérateur (contrainte `@@unique([operatorId,
 * shareCode])`) : la recherche part toujours du slug, donc deux opérateurs
 * peuvent porter le même code sans se marcher dessus. Ça garde le code à six
 * caractères même quand le nombre de sorties grandit.
 */
export async function ensureShareCode(sortie: { id: string; operatorId: string; shareCode: string | null }): Promise<string> {
  if (sortie.shareCode) return sortie.shareCode;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomCode();
    const taken = await prisma.sortie.findFirst({
      where: { operatorId: sortie.operatorId, shareCode: code },
      select: { id: true },
    });
    if (taken) continue;
    const updated = await prisma.sortie.update({ where: { id: sortie.id }, data: { shareCode: code } });
    return updated.shareCode!;
  }
  throw new Error("Impossible de générer un code de boutique unique");
}

/**
 * L'URL absolue, celle qu'on imprime sur un QR code et qu'on envoie par
 * e-mail. Sans NEXT_PUBLIC_STORE_URL (en local, sur une preview Vercel), on
 * retombe sur le domaine principal et son chemin interne : le lien reste
 * cliquable au lieu de pointer vers un sous-domaine qui n'existe pas là.
 */
export function storeUrl(slug: string, code: string): string {
  const store = process.env.NEXT_PUBLIC_STORE_URL?.trim();
  if (store) return `${store.replace(/\/+$/, "")}/${slug}/${code}`;
  const app = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
  return `${app}/s/${slug}/${code}`;
}

/**
 * Le chemin tel que le NAVIGATEUR le voit, à passer aux composants client
 * pour leurs liens et leurs `router.push`.
 *
 * Deux hôtes servent la même boutique : store.linktrip.co/{slug}/{code}, où
 * middleware.ts réécrit vers /s/{slug}/{code}, et le domaine principal, qui
 * sert /s/... tel quel (c'est ce qu'on a en local, sans sous-domaine). Une
 * navigation côté client vers le chemin interne depuis le sous-domaine
 * donnerait store.linktrip.co/s/{slug}/{code}, réécrit une seconde fois en
 * /s/s/... donc en 404. D'où la lecture de l'en-tête Host plutôt qu'un
 * chemin en dur.
 *
 * Les appels d'API, eux, sont identiques sur les deux hôtes : /api/... n'est
 * jamais réécrit.
 */
export function publicStorePath(slug: string, code?: string): string {
  const onStoreHost = (headers().get("host") ?? "").split(":")[0]!.startsWith("store.");
  const tail = code ? `/${slug}/${code}` : `/${slug}`;
  return onStoreHost ? tail : `/s${tail}`;
}

/**
 * Les appels d'API portent sur l'opérateur, jamais sur la sortie : le code
 * n'est plus un secret, seulement un raccourci vers le bon jour.
 */
export function apiStoreBase(slug: string): string {
  return `/api/store/${slug}`;
}

export interface StoreOperator {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string;
  pricePhotoCents: number;
  priceAllCents: number;
  packOnly: boolean;
}

function toStoreOperator(o: {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string;
  pricePhotoCents: number;
  priceAllCents: number;
  packOnly: boolean;
}): StoreOperator {
  return {
    id: o.id,
    name: o.name,
    slug: o.slug,
    logoUrl: o.logoUrl,
    brandColor: o.brandColor,
    pricePhotoCents: o.pricePhotoCents,
    priceAllCents: o.priceAllCents,
    packOnly: o.packOnly,
  };
}

/** L'opérateur d'une boutique, par son slug. Null si le slug n'existe pas. */
export async function resolveOperator(slug: string): Promise<StoreOperator | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const operator = await prisma.operator.findUnique({ where: { slug: normalized } });
  return operator ? toStoreOperator(operator) : null;
}

/**
 * La sortie désignée par un code, dans la boutique d'un opérateur. Le code
 * n'est plus un secret (la boutique est publique) mais il désigne bien UNE
 * sortie : son lien n'ouvre que ses créneaux, pas ceux des autres sorties du
 * même jour.
 */
export async function resolveSortieByCode(slug: string, code: string): Promise<{ operator: StoreOperator; sortieId: string; startsAt: Date } | null> {
  const operator = await resolveOperator(slug);
  if (!operator) return null;

  const normalizedCode = code.trim().toLowerCase();
  if (!normalizedCode) return null;

  const sortie = await prisma.sortie.findFirst({
    where: { operatorId: operator.id, shareCode: normalizedCode, mode: "GROUPE" },
    select: { id: true, startsAt: true },
  });
  if (!sortie) return null;

  return { operator, sortieId: sortie.id, startsAt: sortie.startsAt };
}
