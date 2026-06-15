---
name: db-migrate
description: Make a database schema change in HGT (Drizzle + PostgreSQL) — edit schema, generate/apply migrations, update contract and routes. Use for any change to tables, columns, indexes, or seed data.
---

# Drizzle schema-change workflow

Schema source of truth: `apps/api/src/db/schema.ts` (single file, snake_case casing
is automatic). Generated SQL lives in `apps/api/drizzle/` — never hand-edit those.

## Steps

1. Edit `apps/api/src/db/schema.ts`. Follow existing patterns: uuid PKs, `createdAt`
   defaults, explicit unique constraints, `onDelete: "cascade"` for user-owned rows.
2. Apply locally:
   - Iterating in dev: `pnpm db:push` (direct sync, no migration file).
   - Final change destined for production: `pnpm db:generate` → review the SQL it
     created in `apps/api/drizzle/` → commit it. Production applies with `pnpm db:migrate`.
   - If you used `db:push` while iterating, still finish with `db:generate` so the
     migration history matches the schema.
3. Ripple the change outward (contract-first rule):
   - `packages/contract/src/index.ts` — response/request schemas.
   - `apps/api/src/routes/*` — queries and serialization (use `toPublicUser` for users).
   - `apps/app/src/lib/api.ts` + UI call sites.
4. Seed data changes go in `apps/api/scripts/seed-keywords.ts` (keywords) — keep it
   idempotent.
5. Verify: `pnpm check-types && pnpm lint`, then exercise the affected route against
   the local stack (`dev-env` skill); `pnpm --filter api db:studio` to inspect rows.

## Cautions

- Production DB is RDS, applied via `db:migrate` during deploy (`DEPLOY.md`).
  Destructive migrations (drops, type changes) need an explicit plan — call them out
  to the user instead of burying them in generated SQL.
- `users.session` is security-sensitive: any new query returning users must strip it
  (`apps/api/src/lib/public-user.ts`).
- Local DB reset: `docker compose down -v` (destroys local data only).
