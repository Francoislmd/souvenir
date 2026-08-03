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
  async headers() {
    return [
      {
        // Galerie de groupe (brief §5.1) : lien non indexable en plus du
        // token aléatoire — posé ici plutôt que dans middleware.ts, qui
        // exclut délibérément tout /g/ de son matcher (routes publiques,
        // aucun cookie Supabase à y rafraîchir).
        source: "/g/s/:path*",
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
