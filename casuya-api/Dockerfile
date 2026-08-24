# Casuya API Gateway — Dockerfile
# Builds the full pnpm monorepo so workspace:* deps (@casuya/common, casuya-exams, casuya-math) resolve
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy root workspace manifests first for efficient layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY casuya-common/package.json casuya-common/package.json
COPY casuya-math/package.json casuya-math/package.json
COPY casuya-exams/package.json casuya-exams/package.json
COPY casuya-api/package.json casuya-api/package.json

RUN pnpm install --frozen-lockfile

# Copy full source
COPY . .

# Build all workspace packages in dependency order
RUN pnpm --filter @casuya/common build \
  && pnpm --filter casuya-math build \
  && pnpm --filter casuya-exams build \
  && pnpm --filter casuya-api build

FROM node:20-alpine AS runtime

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules/ node_modules/
COPY --from=builder /app/casuya-api/dist/ casuya-api/dist/
COPY --from=builder /app/casuya-common/dist/ casuya-common/dist/
COPY --from=builder /app/casuya-math/dist/ casuya-math/dist/
COPY --from=builder /app/casuya-exams/dist/ casuya-exams/dist/
COPY --from=builder /app/casuya-api/package.json casuya-api/package.json

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

WORKDIR /app/casuya-api
CMD ["node", "dist/server.js"]
