/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
    outputFileTracingIncludes: {
      "/**": [
        "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/*.node",
        "../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/runtime/**",
        "../../node_modules/.pnpm/@prisma+engines@*/node_modules/@prisma/engines/*.node",
      ],
    },
  },
};

export default nextConfig;
