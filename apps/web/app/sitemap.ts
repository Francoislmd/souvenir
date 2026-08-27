import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { ACTIVITES } from "@/app/(marketing)/activites/activites.data";

// Uniquement les pages publiques et indexables : la landing, les pages
// activité et les pages légales. Tout le reste (galeries, espace opérateur, auth) est exclu —
// voir aussi robots.ts et la règle X-Robots-Tag de next.config.mjs pour /g/.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_APP_URL;
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    // /fonctionnement et /simulation sont redirigés en 301 vers /produit :
    // une URL redirigée n'a rien à faire dans un sitemap.
    { url: `${base}/produit`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/tarifs`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/liste-attente`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    // Les quatorze pages activité, générées depuis la même table que les
    // routes : ajouter une activité l'ajoute ici sans y toucher.
    ...ACTIVITES.map((a) => ({
      url: `${base}/activites/${a.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${base}/mentions-legales`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cgv`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
