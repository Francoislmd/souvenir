import { withSentryConfig } from "@sentry/nextjs";

// Domaine public du bucket R2 des aperçus, logos et couvertures (lib/storage.ts).
const previewsHost = (() => {
  try {
    return new URL(process.env.R2_PREVIEWS_PUBLIC_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      ...(previewsHost ? [{ protocol: "https", hostname: previewsHost }] : []),
      // Logos et couvertures déposés avant le passage à R2, tant que
      // scripts/migrate-storage-to-r2.ts n'a pas réécrit leurs URL.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    // Requis sur Next 14.x pour activer instrumentation.ts (Sentry) — à
    // retirer si upgrade vers Next 15+, où c'est stable par défaut.
    instrumentationHook: true,
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "sharp", "@napi-rs/canvas"],
    // Ce qui part dans CHAQUE fonction Vercel : le strict nécessaire à Prisma
    // sur Vercel, et rien d'autre. Jusqu'au 22/10/2026 on y mettait tous les
    // moteurs (*.node, y compris celui du Mac), tout runtime/** (wasm MySQL,
    // SQLite…) et @prisma/engines (outils de migration, inutiles à
    // l'exécution) : ~40 Mo par fonction, ce qui saturait le « Functions
    // Storage » gratuit de Vercel (10 Go) au fil des déploiements.
    outputFileTracingIncludes: {
      "/**": [
        "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node",
        "../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/runtime/library.js",
      ],
    },
    outputFileTracingExcludes: {
      "/**": [
        "../../node_modules/.pnpm/@prisma+engines@*/**",
        "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/libquery_engine-darwin*",
        "../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/runtime/*.wasm",
        "../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/runtime/query_engine_bg.*",
        "../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/runtime/edge*",
        "../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/runtime/react-native*",
      ],
    },
  },
  /* /produit est devenue la page pilier : elle a absorbé la démo de
     /fonctionnement et le simulateur de /simulation. Redirections permanentes
     vers les ancres correspondantes — les deux URL ont pu être partagées. */
  async redirects() {
    return [
      { source: "/fonctionnement", destination: "/produit#demo", permanent: true },
      { source: "/simulation", destination: "/produit#simulateur", permanent: true },
      /* /tarifs supprimée le 26/09/2026 : la grille vit dans le bloc #tarif de
         l'accueil. L'URL a pu être partagée (prospection, sitemap). */
      { source: "/tarifs", destination: "/#tarif", permanent: true },
      /* La racine du sous-domaine des boutiques ne mène nulle part : sans
         slug, il n'y a pas d'opérateur, et sans code il n'y a pas de sortie.
         Renvoi sur le site plutôt qu'une landing marketing servie sous
         store.linktrip.co, qui existerait alors en double aux yeux de Google.
         Traité ici et pas dans middleware.ts, dont le matcher exclut "/". */
      {
        source: "/",
        has: [{ type: "host", value: "store.(?<storeDomain>.*)" }],
        destination: "https://:storeDomain",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        // Galeries (individuelles et de groupe) : lien non indexable en plus
        // du token aléatoire — posé ici plutôt que dans middleware.ts, qui
        // exclut délibérément tout /g/ de son matcher (routes publiques,
        // aucun cookie Supabase à y rafraîchir). Défense en profondeur en
        // complément de robots.ts : un Disallow seul n'empêche pas
        // l'indexation d'une URL déjà liée ailleurs, juste son exploration.
        source: "/g/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // Les boutiques, servies sur le domaine principal (en local, ou en
        // secours si le sous-domaine tombe). Sur store.linktrip.co le même
        // header est posé par middleware.ts, qui voit le chemin d'entrée
        // avant réécriture.
        source: "/s/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

// Sans SENTRY_AUTH_TOKEN (variable de build, absente en local), l'étape
// d'upload des source maps est silencieusement ignorée — le build réussit
// quand même, cf. https://docs.sentry.io/platforms/javascript/guides/nextjs/.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  webpack: { automaticVercelMonitors: true },
});
