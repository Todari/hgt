# packages/contract — shared API contract

Single file: `src/index.ts`. Zod schemas + `z.infer` types for every API
request/response shape, plus the `{ success, data }` envelope and WS event union.
**Zero runtime dependencies besides zod** — it is imported by both the Hono server
and the Next.js client, so never add server-only or browser-only code here.

Workflow for any API shape change (contract-first, in this order):

1. Edit the schema here.
2. Update the API route that validates with it (`apps/api/src/routes/`).
3. Update the app client (`apps/app/src/lib/api.ts`) and its call sites.
4. `pnpm check-types` at the root — both apps must compile against the new shape.

Conventions: schemas are `camelCaseSchema`, inferred types are exported PascalCase
(`export type User = z.infer<typeof userSchema>`). Public user shapes must never
include the session token. WS events are a discriminated union on `type`
(`wsServerEventSchema`) — extend the union rather than adding parallel schemas.
