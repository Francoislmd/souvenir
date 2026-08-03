import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

// Uniquement les pages publiques et indexables : la landing et les pages
// légales. Tout le reste (galeries, espace opérateur, auth) est exclu —
// voir aussi robots.ts et la règle X-Robots-Tag de next.config.mjs pour /g/.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_APP_URL;
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/mentions-legales`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cgv`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
