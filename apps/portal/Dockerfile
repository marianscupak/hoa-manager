# Build context is the repository root:
#   docker build -f apps/portal/Dockerfile .
# Produces the "web" image: Caddy serving the built SPA and proxying /api.
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/portal/package.json apps/portal/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile

COPY . .
# Same-origin API: the SPA calls its own origin, Caddy proxies /api.
ENV VITE_API_URL=/
RUN pnpm turbo run build --filter=@hoa-mngr/portal

FROM caddy:2
COPY docker/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /repo/apps/portal/dist /srv
