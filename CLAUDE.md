# HGT — 홍익대 키워드 매칭 소개팅 서비스

Campus dating service for Hongik University students: portal-verified signup,
keyword-based profiles, weekly 1:1 matching, realtime chat. TypeScript Turborepo.

## Monorepo map

| Path | What | Stack |
|------|------|-------|
| `apps/api` | Backend HTTP+WS API → [apps/api/CLAUDE.md](apps/api/CLAUDE.md) | Hono, Drizzle, PostgreSQL |
| `apps/app` | User-facing app (web + Capacitor iOS/Android) → [apps/app/CLAUDE.md](apps/app/CLAUDE.md) | Next.js 15, React 19, Panda CSS, Framer Motion |
| `apps/landing` | Marketing page — currently a placeholder | Next.js 15 |
| `packages/contract` | Shared zod schemas + API types → [packages/contract/CLAUDE.md](packages/contract/CLAUDE.md) | zod only, zero runtime deps |
| `packages/ui` | Shared UI components — placeholder, unused by apps | React |
| `packages/eslint-config`, `packages/typescript-config` | Shared lint/TS configs | — |
| `legacy/hgt-server` | **Reference only.** Pre-rewrite Go/MongoDB backend. Never import from it; only consult for historical design decisions. | — |
| `docs/` | Architecture & data-flow docs (start with [docs/architecture.md](docs/architecture.md)) | — |

## Commands (run from repo root)

```bash
pnpm install                      # also runs `prepare` → panda codegen
pnpm dev                          # all apps via turbo (api :8080, app :3000)
pnpm --filter api dev             # backend only
pnpm --filter app dev             # frontend only (needs api running for authed pages)
pnpm build && pnpm lint && pnpm check-types   # CI trio — run before claiming done
docker compose up -d postgres     # local DB (host port 5433, db/user/pw: hgt/hgt/hgt_local_dev)
pnpm db:push                      # dev: sync Drizzle schema directly
pnpm db:generate && pnpm db:migrate   # prod-style migrations
pnpm --filter api db:seed         # seed keyword catalog (required before profiles work)
```

Project skills (in `.claude/skills/`): **dev-env** (boot the full local stack),
**mobile-qa** (screenshot/QA the app incl. authed pages), **db-migrate** (schema-change workflow).

MCP: `.mcp.json` exposes the local dev DB read-only as `hgt-postgres` (requires the
docker Postgres to be up). For ad-hoc SQL without MCP:
`docker exec hgt-postgres psql -U hgt -d hgt -c '<query>'`.

## Architecture in one paragraph

`packages/contract` is the source of truth for API shapes: the API validates request
bodies with its zod schemas, the app types its client (`apps/app/src/lib/api.ts`) with its
inferred types. All HTTP responses use the `{ success, data }` envelope
(`apps/api/src/lib/response.ts`). Auth = Hongik portal login (`POST /auth/hongik`) →
bearer session token stored in `users.session` (rotated every login) and in the app's
`localStorage.hgt_session`. Realtime = WebSocket (`apps/api/src/ws/`) pushing
`message`/`match` events. Weekly matching = keyword-scored bipartite assignment
(`apps/api/src/matching/`). Details: [docs/architecture.md](docs/architecture.md).

## Conventions

- **Commits**: `type(scope): description` — e.g. `feat(api): …`, `fix(app): …`. Scopes: api, app, matching, auth, deploy.
- **Contract-first**: changing an API shape = edit `packages/contract` first, then API route, then app client. Never let the three drift.
- **TypeScript strict** everywhere; lint is `--max-warnings 0`. Comments/docs in English, user-facing strings in Korean (with `word-break: keep-all` styling).
- **DB naming**: snake_case columns via Drizzle `casing: "snake_case"`; camelCase in TS.

## Gotchas (read before debugging)

- `styled-system/` is **generated** by Panda (`pnpm install` runs codegen). Styles broken? Re-run `pnpm --filter app prepare`. Never edit it.
- **NEVER run `next build` while `next dev` is running** on the same app — it corrupts `.next` (all routes 500). Fix: kill dev, `rm -rf apps/app/.next`, restart.
- Local Postgres is on host port **5433** (not 5432).
- Session tokens rotate on every login — an old token in a test script goes stale after re-login.
- Keyword catalog must be seeded (`db:seed`) before profile updates or `qa-seed` work.
- Production runs on EC2 via systemd (`deploy/hgt-api.service`); see `DEPLOY.md` before touching deploy config.
