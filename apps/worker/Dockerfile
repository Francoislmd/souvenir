FROM node:20-bookworm-slim

# sharp needs these at runtime (even though it bundles libvips, it links against system libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/db/prisma ./packages/db/prisma
COPY apps/worker/package.json ./apps/worker/

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install only the worker + its deps (--filter includes workspace deps transitively)
RUN pnpm install --frozen-lockfile --filter @souvenir/worker...

# Copy source after installing so changes don't bust the install cache
COPY packages/db/src ./packages/db/src
COPY packages/db/tsconfig.json ./packages/db/
COPY apps/worker/src ./apps/worker/src
COPY apps/worker/tsconfig.json ./apps/worker/

# @souvenir/db a "main": "./src/index.ts" (TS brut, pas de build) — un
# `node dist/index.js` compilé par tsc ne pourrait pas résoudre cet import
# au runtime (Node 20 n'exécute pas de .ts nativement). On lance donc le
# worker via tsx, qui gère la résolution TS du monorepo à la volée.
WORKDIR /app/apps/worker
CMD ["npx", "tsx", "src/index.ts"]
