<div align="center">

<img src="apps/portal/src/assets/logo/logo-512.png" alt="HOA Manager" width="88" />

# HOA Manager

**Voting and owner-register software for homeowners associations.**
Runs the vote, applies the rules the law actually requires, and leaves a record you can defend afterwards.

[![Deploy](https://github.com/marianscupak/hoa-manager/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/marianscupak/hoa-manager/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)

**[hoa.marianscupak.com →](https://hoa.marianscupak.com/)**

</div>

---

## Why this exists

A vote in a homeowners association is a legal act, not a poll. Whether a resolution passes depends on who owned which unit that day, how large their share of the building is, what counts towards the quorum, and which denominator the majority is measured against. Get one of those wrong and the resolution is voidable — which is why most associations still run votes on paper and hope nobody checks the arithmetic.

HOA Manager models those rules explicitly. The building's ownership structure, the rules of each vote, and the resulting tally are first-class domain objects with their own tests, rather than assumptions buried in a spreadsheet.

The domain is Czech (_společenství vlastníků jednotek_, SVJ), so the built-in rule floors follow Czech civil law. The interface is bilingual — Czech and English.

## What it does

**Exact fractional arithmetic.** Ownership shares stay as `numerator / denominator` from the cadastre all the way to the final tally. Real denominators look like `206422` or `47326`; floating point loses those on the first division, so nothing is ever converted to a decimal except for display.

**Rulesets that refuse to be wrong.** Each vote carries a ruleset — quorum measure and threshold, majority type, comparator, denominator basis, weight basis. Configurations below the statutory floor are rejected outright, as are the combinations the law does not allow for written votes. The settings an association may only use if its own statutes say so are a separate tier: allowed, but only against an explicit acknowledgement, which is then written into the audit trail.

**Two ways to vote.** _Per rollam_ (written vote) collects ballots and signed consents over a window. _Assembly record_ captures a physical meeting: attendance, ballots recorded from paper, and a published record at the end.

**Delegation, proxy and co-ownership.** A unit can be represented by a co-owner or delegated to another member, and delegates see the units that answer to them. Units that a consent or a change of representative would leave with nobody able to vote get flagged before they are stranded.

**A register that remembers.** Ownership is stored as periods, not as a current value, so the register can answer who owned a unit on a given date. The electorate is snapshotted when a vote opens, so later edits to the register never move the result of a vote already under way.

**Cadastre import.** Upload an XML export from the Czech cadastre (ČÚZK), review what was parsed, and import units, owners and shares in one pass instead of typing several hundred fractions by hand.

**An audit trail with a purpose.** An append-only event log feeds a human-readable timeline on every vote and a privileged JSON export that reconstructs the whole thing — configuration, electorate, ballots, tally — for anyone who later asks how a number came about.

**Live and final results.** Turnout and provisional results while a vote is open; per-question outcomes, participation and the closing record once it is closed.

## Tech stack

| Layer        | What's used                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| **API**      | NestJS 11, CQRS, Drizzle ORM, PostgreSQL 17, Zod-validated DTOs and config                                       |
| **Web**      | React 19, Vite, TanStack Query, React Router, Tailwind CSS 4, Radix primitives, react-hook-form, i18next (cs/en) |
| **Contract** | OpenAPI generated from the Nest app; orval generates the typed react-query hooks the portal uses                 |
| **Email**    | React Email templates in a shared package, delivered through Brevo                                               |
| **Infra**    | Docker, Caddy, GitHub Actions → GHCR → a single Hetzner host, Prometheus + Loki + Grafana, Cloudflare R2         |
| **Tooling**  | pnpm workspaces, Turborepo, ESLint, Prettier, Jest (API) and Vitest (web)                                        |

## Architecture in one paragraph

A modular monolith. Each module (`tenancy`, `identity`, `auth`, `property`, `audit`, `voting`) is sliced into `domain`, `application`, `api` and `infrastructure`. Dependencies point one way — voting on the core, and inside the core specific modules on general ones — and a test fails on any cycle between modules. The rules worth arguing about — tally, quorum, ruleset validation, electorate resolution, ballot answers — live in pure domain functions with no framework imports and carry the bulk of the unit tests. Application code talks to ports; Drizzle, object storage and the email provider are adapters behind them. Everything is multi-tenant: one deployment serves many associations, and the active one is resolved per request.

## Getting started

**Prerequisites:** Node 22, pnpm (the version pinned in `packageManager` in `package.json`), Docker.

```bash
pnpm install
cp .env.docker.example .env.docker   # set POSTGRES_PASSWORD
docker compose up -d postgres
```

Postgres is published on port `5432` by default. If that port is taken, put `POSTGRES_PORT=<free port>` in a root `.env` (see `.env.example` — Compose reads host-side substitution from there, not from `.env.docker`) and use the same port in `DATABASE_URL` below.

Create `apps/api/.env.local`:

```ini
DATABASE_URL=postgresql://hoa_manager:<password>@localhost:5432/hoa_manager
CORS_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
JWT_SECRET=<at least 32 characters>
```

Google sign-in, file uploads and outgoing email are optional and configured as all-or-nothing groups (`GOOGLE_*`, `R2_UPLOADS_*`, `BREVO_API_KEY` + `EMAIL_FROM`) — the config schema rejects a half-filled group at boot rather than failing later.

`LOG_LEVEL` is optional and defaults to `info`. It takes any winston level (`error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`); `debug` adds the scheduler's per-minute checks. The API logs one JSON line per request to stdout, without the query string, and every line carries a `correlationId` that also lands on `audit_events.correlation_id`.

Create `apps/portal/.env.local`:

```ini
VITE_API_URL=http://localhost:3000
```

Then migrate, seed and run everything:

```bash
pnpm --filter @hoa-mngr/api db:migrate
pnpm --filter @hoa-mngr/api db:seed
pnpm dev
```

| Service    | URL                                                              |
| ---------- | ---------------------------------------------------------------- |
| Portal     | http://localhost:5173 (proxies `/api` to the API)                |
| API        | http://localhost:3000/api                                        |
| Swagger UI | http://localhost:3000/api/docs                                   |
| Grafana    | http://localhost:3100 (with `docker compose up -d` for the rest) |

The seed creates a demo association with units, owners and votes, and an admin login: `admin@hoa.local` / `AdminPassword123!`.

### Everyday commands

| Command          | What it does                                                  |
| ---------------- | ------------------------------------------------------------- |
| `pnpm dev`       | API and portal in watch mode                                  |
| `pnpm test`      | Jest and Vitest suites across the workspace                   |
| `pnpm typecheck` | `tsc --noEmit` everywhere                                     |
| `pnpm lint`      | ESLint everywhere                                             |
| `pnpm format`    | Prettier write (CI runs `format:check`)                       |
| `pnpm generate`  | Regenerate the OpenAPI spec, then the typed portal API client |
| `pnpm build`     | Build every package and app                                   |

## Repository layout

```
apps/
  api/                NestJS API — modules, domain rules, Drizzle schema & migrations
  portal/             React single-page app — one folder per feature
packages/
  ui/                 Shared component library (Radix + Tailwind + TanStack Table)
  emails/             React Email templates and renderer
  eslint-config/      Shared lint rules
  typescript-config/  Shared tsconfig bases
docker/               Caddy, Postgres init, Prometheus/Loki/Promtail/Grafana, backups
scripts/              Operational helpers (seeding and packaging for user-testing sessions)
```

## Deployment

A push to `main` runs the full CI suite, builds the API and web images, pushes them to GHCR, and deploys over SSH to a single Hetzner host: pull, run migrations, `docker compose up -d`. The job then polls the public health endpoint until the whole chain — DNS, Caddy, the API process, the database connection — answers, so a container that starts and immediately crashes cannot deploy green.

Caddy terminates TLS and serves the built portal, Postgres is bound to loopback only, backups go to object storage nightly, and Prometheus, Loki and Grafana run alongside the app on the same host.

## Status

Built as a master's thesis project. A live instance runs at [hoa.marianscupak.com](https://hoa.marianscupak.com/).

## License

[MIT](LICENSE) © Marian Ščupák
