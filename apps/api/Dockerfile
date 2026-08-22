# Build context is the repository root:
#   docker build -f apps/api/Dockerfile .
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo

# Manifests first so the dependency layer caches across source changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/portal/package.json apps/portal/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm turbo run build --filter=@hoa-mngr/api
RUN pnpm --filter @hoa-mngr/api deploy --prod /out

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/dist ./dist
COPY --from=build /out/package.json ./package.json
# Drizzle migration SQL is read at runtime by dist/infrastructure/db/migrate.
COPY apps/api/src/infrastructure/db/migrations ./migrations
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
