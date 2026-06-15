# HGT

홍익대학교 재학생 대상 키워드 매칭 소개팅 서비스.
Portal-verified signup → keyword profiles → weekly 1:1 matching → realtime chat.

TypeScript Turborepo. **Architecture: [docs/architecture.md](docs/architecture.md)** ·
**Deploy: [DEPLOY.md](DEPLOY.md)** · **Agent guide: [CLAUDE.md](CLAUDE.md)**

## Directory

| Path | Description |
|------|-------------|
| `apps/api` | Backend — Hono + Drizzle + PostgreSQL ([README](apps/api/README.md)) |
| `apps/app` | User app — Next.js 15 + Panda CSS, web & Capacitor iOS/Android |
| `apps/landing` | Landing page (placeholder) |
| `packages/contract` | Shared zod schemas / API types |
| `packages/ui` | Shared UI components (placeholder) |
| `packages/eslint-config` / `packages/typescript-config` | Shared configs |
| `legacy/hgt-server` | Pre-rewrite backend, reference only |

## Quick start

Requirements: Node ≥ 20.15, pnpm 9, Docker.

```bash
pnpm install
docker compose up -d postgres          # local DB on :5433
cp apps/api/.env.example apps/api/.env
pnpm db:push                           # create schema
pnpm --filter api db:seed              # seed keyword catalog
pnpm dev                               # api :8080, app :3000
```

## Common commands

```bash
pnpm build / lint / check-types        # CI checks (turbo)
pnpm db:generate && pnpm db:migrate    # production-style migrations
pnpm --filter app storybook            # component workshop
pnpm --filter app build:app            # Capacitor static export
```

## Tech stack

Hono · Drizzle ORM · PostgreSQL · Next.js 15 · React 19 · Panda CSS · Framer Motion ·
Capacitor · zod · Turborepo · pnpm
