---
name: dev-env
description: Boot, verify, or reset the full HGT local dev stack (Postgres + Hono API + Next.js app). Use when the task needs a running backend/frontend, when authed pages or DB-backed features must be exercised, or when the dev server is misbehaving.
---

# HGT local dev stack

## Boot order

```bash
# 1. Postgres (host port 5433; user/pw/db = hgt / hgt_local_dev / hgt)
docker compose up -d postgres
docker compose ps   # wait for healthy

# 2. API env (first time only)
cp apps/api/.env.example apps/api/.env   # defaults already point at :5433

# 3. Schema + seed (idempotent)
pnpm db:push
pnpm --filter api db:seed                # keyword catalog — REQUIRED before profiles/matching

# 4. Run (background each, or `pnpm dev` for both via turbo)
pnpm --filter api dev                    # http://localhost:8080
pnpm --filter app dev                    # http://localhost:3000
```

Health checks: `curl -s http://localhost:8080/` (API), `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000` (app).

## QA fixtures / test data

- `pnpm --filter api exec tsx scripts/qa-seed.ts` creates a persistent matched pair
  with a conversation and prints `{ session, convId }` — use that session for authed
  QA (see the `mobile-qa` skill). It temporarily isolates other `explore` users while
  forcing the match, then restores them.
- Integration scripts: `apps/api/scripts/test-*.ts` (chat, ws, matching, e2e,
  hongik-login). Run with `pnpm --filter api exec tsx scripts/<name>.ts`.
  `test-hongik-login.ts` needs real portal credentials — skip unless provided.

## Resets & known failure modes

- **App shows "missing required error components" / every route 500s**: a `next build`
  ran while `next dev` was live. Kill the process on :3000, `rm -rf apps/app/.next`,
  restart dev. Never build while dev runs.
- **Styles missing / `_panda/css` unresolved**: regenerate with `pnpm --filter app prepare`.
- **DB wedged / want a clean slate**: `docker compose down -v && docker compose up -d postgres`
  then re-run step 3. (Destroys local data only — confirm with the user if in doubt.)
- **Port 5433 conflict**: another stack's Postgres; check `docker ps`.
- zsh: never name shell variables `path`, `status`, or `UID` — they are reserved and
  clobber `$PATH`.

## Before claiming done

`pnpm lint && pnpm check-types` always; `pnpm build` if app code changed (stop dev first).
