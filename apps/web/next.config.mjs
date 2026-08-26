import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
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
    outputFileTracingIncludes: {
      "/**": [
        "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/*.node",
        "../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/runtime/**",
        "../../node_modules/.pnpm/@prisma+engines@*/node_modules/@prisma/engines/*.node",
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
