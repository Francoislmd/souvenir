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

export default nextConfig;
