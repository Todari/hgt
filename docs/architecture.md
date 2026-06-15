# HGT Architecture

> Audience: engineers and coding agents. Keep this file in sync when flows change —
> it is referenced from the root `CLAUDE.md`.

## System overview

```
┌────────────────────┐         HTTPS/WS          ┌─────────────────────────┐
│ apps/app           │  ───────────────────────▶ │ apps/api (Hono, :8080)  │
│ Next.js web        │   bearer session token    │  ├ REST routes          │
│ + Capacitor iOS/   │ ◀───────────────────────  │  ├ WS /ws (realtime)    │
│   Android webview  │   {success,data} / WS evt │  ├ matching engine      │
└────────────────────┘                           │  └ FCM push (optional)  │
        ▲ types                                  └───────────┬─────────────┘
        │                                                    │ Drizzle
┌───────┴────────────┐                           ┌───────────▼─────────────┐
│ packages/contract  │ ◀── zod validation ────── │ PostgreSQL              │
│ zod schemas/types  │                           │ (docker :5433 local,    │
└────────────────────┘                           │  RDS in production)     │
                                                 └─────────────────────────┘
External: Hongik portal (scraped at login, EUC-KR), Firebase FCM (push).
```

## Error envelope & global middleware

Every response — success, validation error, 404, 500 — uses the
`{ success, data }` envelope (`src/lib/response.ts`). `app.onError` logs and
returns a generic Korean 500 (`HTTPException`s keep their own status);
`app.notFound` returns the envelope too. A global `bodyLimit` rejects bodies
over 64 KiB with a 413 envelope. The request logger masks the `?token=` query
param on `/ws` lines so session tokens never reach logs.

## Auth flow

1. `POST /auth/hongik` with `{ id: 학번, pw }` (`apps/api/src/routes/auth.ts`).
2. Server logs into the Hongik portal (`src/hongik/login.ts`, cheerio + iconv-lite) and
   extracts verified facts: name, studentId, major, gender, age, academicStatus.
   The password is forwarded only, never stored.
3. Gates, in order: `academicStatus` must be in `HONGIK_ALLOWED_STATUSES`
   (default 재학,휴학); the studentId must not be in `banned_students`
   (403 "이용이 제한된 계정입니다…" — survives delete + re-signup).
   Rate limits: 5/10min per student id, 300/10min per IP (`src/lib/rate-limit.ts`).
4. User row upserted; `users.session` **rotated** (`src/lib/session-token.ts`) and any
   sockets opened with the old token are closed; response `{ session, user }`.
5. App stores the token in `localStorage.hgt_session` (`apps/app/src/lib/session.ts`)
   and sends `Authorization: Bearer <session>` on every call. `sessionAuth` middleware
   resolves it to a user row (`users.session` must be non-NULL; empty tokens rejected)
   and touches `users.last_active_at` when >15 min stale (ops-only column — stripped
   from all public user shapes). Any 401 in the app client redirects to `/signin`.

- **Logout**: `POST /auth/logout` (session-protected, optional `{ deviceToken }`)
  sets `users.session = NULL`, deletes that device token, and closes the user's
  sockets. Single-session model: re-login also invalidates previous tokens.
- **Demo login (App Review)**: when `DEMO_ACCOUNTS="id:pw,id2:pw2"` is set, a
  matching id+pw skips the portal entirely and upserts a fixed demo profile
  (데모 / 데모대학과 / male / age 24 / 재학; studentId = the demo id). Disabled
  when the env var is unset.

## Profile & keywords

- Static selectable attributes live in `properties` (height/smoke/religion/mbti).
  Reading them is public; `POST /property` additionally requires `X-Admin-Token`.
- The product's core profile model is **keywords** (`keywords` table, 5 categories:
  성격/취미/관심사/라이프스타일/가치관, seeded by `apps/api/scripts/seed-keywords.ts`):
  - `user_self_keywords` — how the user describes themself
  - `user_ideal_keywords` — what they want in a partner
- `PUT /me/profile` validates every referenced keyword id AND property id (the
  property's `type` must match the slot it's submitted for) and replaces the
  keyword sets transactionally (`apps/api/src/routes/me.ts`). Rate limit 30/h.
- **Sensitive-info consent (PIPA 제23조)**: `religionId` is 민감정보. The server
  refuses to store a non-null `religionId` (400) unless the user already has
  `users.sensitive_consent_at` set OR the same request sends
  `agreedToSensitive: true` (which stamps it). Onboarding `StepTerms` collects
  this as a SEPARATE optional consent and gates the religion picker. `religionId`
  is dropped when consent is withdrawn.
- **Activation default-in**: the FIRST `agreedToTerms: true` (i.e. while
  `termsAgreedAt` is still NULL) also sets `explore = true` unless the same
  request sets `explore` explicitly. The app should message this:
  '매칭 풀에 자동으로 참여됩니다. 설정에서 끌 수 있어요'.

## Weekly matching (`apps/api/src/matching/`)

- **Time base**: all week boundaries are **Asia/Seoul** (KST, fixed UTC+9 —
  no DST). `weekStartMonday()` (engine.ts) returns the KST Monday of the week.
- **Trigger** (`scheduler.ts`, only when `MATCH_CRON_ENABLED=true` — exactly one
  instance): a setTimeout chain fires at **Monday 19:00 KST** and re-arms weekly;
  a daily catch-up tick heals missed Mondays (server down) but never runs early —
  it no-ops until this week's fire time has passed. Manual:
  `POST /admin/match/run` (X-Admin-Token). Idempotent per week via
  `match_rounds.weekStart` unique; re-runs only pair still-unmatched users.
- **Candidates**: `explore = true` AND `termsAgreedAt` set AND studentId not in
  `banned_students` (banned users keep their row until deletion) AND not
  long-dormant (`last_active_at` within `MATCH_INACTIVE_DAYS`, default 21; NULL
  counts as active; set 0 to disable during cold-start), with ≥1 self and ≥1
  ideal keyword, split by verified gender.
- **Scoring** (`score.ts`, pure functions — safe to unit-test):
  `directionalScore(ideal, self)` = 1.0 per exact keyword match, 0.3 per same-category
  match; `pairScore` symmetrizes, adds an age-window bonus, and returns 0 for past
  partners (prior `matches` rows) or same-major pairs unless both `canCc`.
  Blocked pairs (either direction) are also forbidden.
- **Assignment** (`assign.ts`): max-weight bipartite matching over the score matrix.
- **Persist & notify** (`engine.ts`): write `matches`, create a `conversations` row per
  pair (pre-existing pair conversations are kept), then notify both sides:
  WS `{ type: "match", partner: PartnerUser, conversationId }` + FCM push whose
  `data` includes `conversationId` for deep-linking.
- **Read model**: `GET /me/match` returns `{ current, previous }`
  (`myMatchResponseSchema`): `current` = this KST week's match, `previous` = the
  most recent earlier one. Each `matchResultSchema` carries an **enriched
  partner** (`matchPartnerSchema` = `partnerUserSchema` + `partnerKeywords`
  grouped by category + `partnerProperties` resolved to display values),
  `sharedKeywords`, and the `conversationId` (nullable). Pairs with a block in
  either direction are excluded. The raw compatibility `score` is **not** exposed
  to the client (server-side only, for assignment/debug).

## Chat & realtime

- REST: `GET /conversations` (partner + last message + unread count),
  `GET/POST /conversations/:id/messages` (`?before` must be ISO 8601 → 400
  otherwise; non-UUID conversation ids are 404s), `POST /conversations/:id/read`.
- Partner objects everywhere use `partnerUserSchema`/`toPartnerUser()`
  (`src/lib/public-user.ts`) — id, name, major, age, gender, army,
  academicStatus, description only. **Never** return a full user row for anyone
  but the profile owner; `toPublicUser()` (owner shape) strips `session` and
  `lastActiveAt`.
- Send path (`src/routes/chat.ts`): content filter → persist →
  `broadcastToUser()` over WS → FCM push (body truncated to 80 chars; `data`
  carries `conversationId`).
- **Content filter** (`src/lib/content-filter.ts`): Korean profanity/성희롱
  wordlist (~30 starter entries — **ops owns curation**) plus phone-number and
  주민등록번호 patterns, matched against a separator-stripped copy of the text.
  Hits are rejected 400 "부적절한 표현이나 개인정보가 포함되어 있어요.".
- Rate limits (per user): messages 20/10s + 300/h; reports 5/day; WS connects
  10/min (excess closed with code 1013). All 429s use the envelope.
- WS (`src/ws/`): client connects with the session token (must match a live,
  non-NULL session); server keeps a per-user registry of `{ send, close }`.
  Events are typed by `wsServerEventSchema` (discriminated union:
  `message` | `match` | `ping`). Liveness is two-layered: protocol-level
  ping/pong every 30s per socket (2 misses → terminate) and an app-level
  `{ type: "ping" }` broadcast every ~25s — clients should treat >30s of
  silence as a dead connection and reconnect. `closeUser(userId)` force-closes
  all of a user's sockets on logout, session rotation, account deletion and ban.
  The app reconnects with exponential backoff (1s→30s cap) in
  `apps/app/src/lib/api.ts#connectRealtime`.
- Safety: blocks (either direction) hide conversations, 403 new messages and
  exclude the pair from `/me/match`; reports land in `reports` with
  `reportedStudentId`/`reportedName` snapshots (reviewable after either account
  is deleted), readable via `GET /admin/reports`. Block/report of nonexistent
  users → 404 envelope.
- **Admin ban**: `POST /admin/users/:id/ban { reason }` (X-Admin-Token) upserts
  `banned_students` from the user's studentId, nulls the session and closes
  sockets. Banned users cannot log back in (see Auth) and are excluded from the
  matching pool.

## Removed/changed surface (privacy audit, 2026-06)

- `GET /user` and `GET /user/:userId` are **deleted** (user enumeration risk);
  partner data flows only through conversations/match results in partner shape.
- `POST /property` now requires `X-Admin-Token` on top of the session.
- `matchResultSchema.partner` and the WS `match` event switched from full
  `userSchema` to the partner shape; `GET /me/match` switched from a single
  nullable result to `{ current, previous }`.

## Data model quick reference (`apps/api/src/db/schema.ts`)

```
users (session, studentId, gender, academicStatus, explore, canCc,
       targetMin/MaxAge, termsAgreedAt, sensitiveConsentAt, lastActiveAt)
├─ user_self_keywords / user_ideal_keywords → keywords(category, value)
├─ height/smoke/religion/mbti property ids → properties(type, value)
├─ device_tokens (push), blocks, reports (+ reported_* snapshots, FKs set-null)
matches (roundId → match_rounds.weekStart [KST Monday], maleUserId, femaleUserId, score)
conversations (userA, userB, matchId set-null) ─ messages (senderId, body, readAt)
banned_students (student_id PK, reason, created_at) — survives user deletion
```

Indexes: `users.session`, `messages(conversation_id, created_at)`.
Deleting a user cascades through keywords/devices/blocks/conversations/messages/
matches; reports are kept with snapshots.

**Deprecated-dead** (Mongo-era leftovers; no code path reads or writes them —
do **NOT** drop yet, removal is a future migration): `user_hobbies`,
`user_targets`, `user_ex_partners`, `users.partnerId`. Past-partner exclusion
actually uses prior `matches` rows.

## Deployment topology (details: `DEPLOY.md`)

- **API**: EC2 (ap-northeast-2), systemd unit `deploy/hgt-api.service`, port 8090,
  Postgres in docker on the same host (localhost-only). Match cron enabled here.
  Schema changes ship as Drizzle migrations (`pnpm db:generate` → commit →
  `pnpm db:migrate` on the server); latest is `0002_productive_lifeguard.sql`.
- **Web**: optional Vercel deploy of `apps/app` with `/api/*` rewrites to EC2.
- **Native**: Capacitor static export with `NEXT_PUBLIC_API_URL` baked in at build.
- Known pre-launch hardening gaps: no TLS in front of the API yet (Caddyfile prepared
  in `deploy/`), Firebase service account optional, admin token must be strong.

## Testing reality

There is no jest/vitest suite. Verification =
`pnpm build && pnpm lint && pnpm check-types` + the ad-hoc integration scripts in
`apps/api/scripts/test-*.ts` (run with `pnpm --filter api exec tsx scripts/<name>.ts`
against a running local stack) + visual QA via the `mobile-qa` skill.
The test scripts self-create prefixed users and run matching in **isolated
non-current weeks** so they never disturb the live/QA round (`qa-seed.ts` owns
the current week). When adding pure logic (e.g. scoring), prefer making it a
pure function so a future test suite can cover it.
