import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/g/",
        "/api/",
        "/sorties",
        "/reglages",
        "/revenus",
        "/onboarding",
        // Groupe de routes (auth) — pas de segment d'URL, chemins réels ci-dessous.
        "/connexion",
        "/mot-de-passe-oublie",
        "/reinitialiser",
      ],
    },
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
