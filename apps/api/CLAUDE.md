# apps/api — Hono backend

Entry: `src/index.ts` (CORS → logger → WS upgrade → public routes → `sessionAuth` → protected routes).
Default port 8080. All responses use `ok()`/`fail()` from `src/lib/response.ts` → `{ success, data }`.

## Layout

| Path | Purpose |
|------|---------|
| `src/routes/` | One file per resource. Public: `auth.ts`, `properties.ts`. Protected: `me.ts`, `users.ts`, `keywords.ts`, `match.ts`, `chat.ts`, `devices.ts`, `safety.ts`. Admin (`X-Admin-Token`): `admin.ts` |
| `src/middleware/` | `session.ts` (bearer → `c.get("user")`), `admin.ts` |
| `src/db/schema.ts` | **Single Drizzle schema file** — documented at top; read it before any data work |
| `src/db/client.ts` | postgres-js client; TLS toggled by `DATABASE_SSL` |
| `src/matching/` | `score.ts` (pure pair scoring) → `assign.ts` (max-weight bipartite) → `engine.ts` (orchestrates + notify) → `scheduler.ts` (weekly cron, gated by `MATCH_CRON_ENABLED`) |
| `src/hongik/login.ts` | Hongik portal scraper (cheerio + iconv-lite EUC-KR). Password is proxied, never stored |
| `src/ws/` | WebSocket: token auth, per-user registry, `broadcastToUser()` |
| `src/push/` | FCM push; no-op unless `FIREBASE_SERVICE_ACCOUNT` set |
| `src/lib/` | `response.ts`, `public-user.ts` (**always** `toPublicUser()`/`toPartnerUser()` before returning a user — strips session token & PII), `rate-limit.ts`, `session-token.ts`, `content-filter.ts`, `blocks.ts`, `observability.ts` (Sentry, no-op unless `SENTRY_DSN`) |
| `drizzle/` | Generated SQL migrations — never hand-edit |
| `scripts/` | tsx-run scripts: `seed-keywords.ts`, `qa-seed.ts` (QA fixture pair, prints `{session, sessionFemale, convId}`), `demo-seed.ts` (App Review: seeds a demo account's profile + current-week match + conversation; prod-safe, idempotent), `test-*.ts` (ad-hoc integration tests — there is no jest suite) |

## Adding an endpoint

1. Add/extend the zod schema in `packages/contract/src/index.ts`.
2. Create the route in `src/routes/<resource>.ts`; validate input with `schema.safeParse`, respond via `ok()`/`fail()`.
3. Register in `src/index.ts` — on `protectedRoutes` unless genuinely public.
4. Add the client method in `apps/app/src/lib/api.ts`.
5. If a user object is returned, pass it through `toPublicUser()`.

## Schema changes

Edit `src/db/schema.ts` only. Dev: `pnpm db:push`. For anything reaching production:
`pnpm db:generate` (creates SQL in `drizzle/`) → commit → `pnpm db:migrate` on the server.
See the `db-migrate` skill.

## Env vars (`.env`, template in `.env.example`)

`DATABASE_URL`, `DATABASE_SSL`, `PORT`, `CORS_ORIGINS`, `HONGIK_ALLOWED_STATUSES`
(default `재학,휴학` — blocks graduates), `ADMIN_TOKEN` (unset = admin routes 403),
`MATCH_CRON_ENABLED` (true on exactly ONE instance), `FIREBASE_SERVICE_ACCOUNT`.

## Domain rules worth knowing

- Matching is weekly, 1:1, male↔female pairs, opt-in via `users.explore`; idempotent per `match_rounds.weekStart`. Score: shared/ideal keyword overlap (exact 1.0 / same-category 0.3) + age-window bonus; 0 if past partner or same-major without `canCc`.
- Blocking hides conversations both ways and rejects new messages (403).
- `DELETE /me` cascades (keywords, devices, blocks, conversations, messages, matches).
- Portal login is rate-limited: 5/10min per student id, 300/10min per IP.

## Verifying changes

`pnpm --filter api check-types && pnpm --filter api lint`, then exercise the relevant
`scripts/test-*.ts` with tsx against a running local stack (see `dev-env` skill).
