# api

HGT backend — **Hono + Drizzle ORM + PostgreSQL**.

Rewritten in TypeScript from the legacy Go/Gin/MongoDB service (preserved at
[`legacy/hgt-server`](../../legacy/hgt-server)). The HTTP shape is kept compatible
(`{ success, data }` envelope, session bearer auth) while the data store moved
from MongoDB to PostgreSQL (AWS RDS in production).

## Quick start

```bash
# 1. from the repo root, start a local Postgres
docker compose up -d postgres

# 2. configure env
cp apps/api/.env.example apps/api/.env

# 3. create the schema (dev: push straight from the Drizzle schema)
pnpm --filter api db:push

# 4. run
pnpm --filter api dev        # or: pnpm dev (runs all apps via turbo)
```

API listens on `http://localhost:8080`.

## Endpoints

| Method | Path                              | Auth        | Notes                                              |
| ------ | --------------------------------- | ----------- | -------------------------------------------------- |
| GET    | `/`                               | –           | health check                                       |
| POST   | `/auth/hongik`                    | –           | Hongik portal login; verifies enrollment, returns `{ session, user }` |
| GET    | `/property`                       | bearer      | selectable attribute values (age/smoke/religion/mbti/height) |
| GET    | `/keyword`                        | bearer      | keyword catalog (5 categories)                     |
| GET    | `/me` / PUT `/me/profile` / DELETE `/me` | bearer | my profile, edit (incl. keyword sets), withdraw   |
| GET    | `/user`, `/user/:userId`          | bearer      | public user profiles                               |
| GET    | `/me/match`                       | bearer      | latest weekly match (partner, score, shared keywords) |
| GET/POST | `/conversations*`               | bearer      | chat list, history, send, mark-read                |
| POST   | `/me/devices`                     | bearer      | register push token                                |
| POST   | `/me/blocks`, `/reports`          | bearer      | block / report a user                              |
| POST   | `/admin/match/run`, GET `/admin/reports` | X-Admin-Token | trigger matching, review reports             |
| WS     | `/ws?token=`                      | session     | realtime `message` / `match` events                |

Auth: `Authorization: Bearer <session>` (token returned by `/auth/hongik`; rotated on
every login). Request/response shapes are defined in
[`packages/contract`](../../packages/contract/src/index.ts). See also
[`CLAUDE.md`](CLAUDE.md) for the full backend guide.

## Database

- Schema lives in [`src/db/schema.ts`](src/db/schema.ts) (Drizzle).
- Dev: `pnpm --filter api db:push` applies the schema directly.
- Proper migrations: `db:generate` then `db:migrate`.
- `db:studio` opens Drizzle Studio.
