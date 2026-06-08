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

| Method | Path                      | Auth   | Notes                                    |
| ------ | ------------------------- | ------ | ---------------------------------------- |
| GET    | `/`                       | –      | health check                             |
| POST   | `/signin`                 | –      | sign up **or** log in; returns a session |
| GET    | `/user`                   | bearer | list users                               |
| GET    | `/user/:userId`           | bearer | get user by id                           |
| POST   | `/property`               | bearer | create an option value                   |
| GET    | `/property`               | bearer | list option values                       |
| GET    | `/property/:type?value=`  | bearer | look up one option value                 |

Auth: send `Authorization: Bearer <session>` (the token returned by `/signin`).

## Database

- Schema lives in [`src/db/schema.ts`](src/db/schema.ts) (Drizzle).
- Dev: `pnpm --filter api db:push` applies the schema directly.
- Proper migrations: `db:generate` then `db:migrate`.
- `db:studio` opens Drizzle Studio.
