# apps/app — Next.js user app (web + Capacitor native)

Next.js 15 App Router, React 19, Panda CSS, Framer Motion. Runs as a website
(`next dev`, :3000) and as a static export inside Capacitor iOS/Android
(`BUILD_TARGET=capacitor next build` → `out/` → `cap sync`).

## Layout

| Path | Purpose |
|------|---------|
| `src/app/` | Routes: `/` (intro), `/signin`, `/onboarding`, `/home`, `/conversations` + `/[conversationId]`, `/settings`, `/safety`, `/design-system` (internal showcase) |
| `src/app/layout.tsx` | Root layout — metadata, `viewport` (incl. `viewport-fit=cover`), providers |
| `src/app/providers.tsx` | `MotionConfig reducedMotion="user"` — keep it |
| `src/lib/api.ts` | **The only place HTTP happens.** Typed via `@hgt-client/contract`; unwraps `{success,data}`; 401 → redirect `/signin`. `connectRealtime()` = WS with exponential backoff |
| `src/lib/session.ts` | `localStorage.hgt_session` get/set/clear |
| `src/lib/push.ts` | Capacitor push registration |
| `src/components/` | `ui/` primitives, `legal/` renderer (`src/content/legal.ts` holds terms text) |
| `styled-system/` | **Generated** by `panda codegen` (the `prepare` script). Never edit; gitignored |

`NEXT_PUBLIC_API_URL` is baked at build time (default `http://localhost:8080`).

## Hard-won mobile rules (violating these caused real iOS WebView jank — do not regress)

- `word-break: keep-all` globally — Korean must not wrap mid-word.
- Safe-area: `viewport-fit=cover` + body padding `env(safe-area-inset-*)`. New full-bleed/fixed UI must respect insets.
- GPU budget: `backdrop-filter` ≤ **14px** (7px under `@media (pointer: coarse)`), **no** full-screen `mix-blend-mode`, **no** infinitely-animated blurs > 16px.
- Keep `reducedMotion="user"`; new animations must degrade gracefully.

## Dev & QA

- Authed pages need the API + seeded DB running — see the `dev-env` skill.
- Visual QA / screenshots (incl. authed pages via injected session): use the `mobile-qa` skill. Do **not** trust low-res screenshots for copy review — verify text in source.
- **NEVER run `next build` while `next dev` is live** on this app — corrupts `.next`, every route 500s. Kill dev → `rm -rf apps/app/.next` → restart.
- Verify: `pnpm --filter app lint && pnpm --filter app check-types`; prod check: stop dev, then `pnpm --filter app build` (expect all pages to compile).

## Styling

Panda CSS only — `css()` / patterns imported from `_panda/css` (tsconfig alias to
`styled-system/`). Theme tokens (ink/primary colors, glass, radii, shadows) live in
`panda.config.ts`; extend tokens there instead of hardcoding values.
