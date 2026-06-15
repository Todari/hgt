---
name: mobile-qa
description: Visually QA the HGT app (apps/app) at mobile viewport — take screenshots of public and authed pages with headless system Chrome / playwright-core, including session injection. Use when verifying UI changes, layout, safe-area, or Korean text rendering.
---

# Mobile visual QA for apps/app

Prereq: full local stack running (`dev-env` skill). Viewport convention: 390×844 @2x (iPhone-ish).

## Public pages (`/`, `/signin`) — headless Chrome one-liner

```bash
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --headless --disable-gpu --window-size=390,844 --force-device-scale-factor=2 \
  --virtual-time-budget=4000 --screenshot=/tmp/hgt-home.png http://localhost:3000/
```

Then `Read` the PNG to inspect it.

## Authed pages (`/home`, `/conversations/*`, `/settings`, …) — playwright-core + session inject

1. Get a session: `pnpm --filter api exec tsx scripts/qa-seed.ts` → prints `{ session, convId }`.
2. Drive system Chrome with playwright-core (already resolvable from apps/app's node_modules; if not, `pnpm dlx` a scratch script):

```js
// /tmp/qa-shot.mjs — node /tmp/qa-shot.mjs <session> <path> <out.png>
import { chromium } from "playwright-core";
const [session, route, out] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await ctx.addInitScript((s) => localStorage.setItem("hgt_session", s), session);
const page = await ctx.newPage();
await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle" });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
```

## Pitfalls

- The cmux/built-in `browser` screenshot tool FAILS in this environment ("Failed to
  capture snapshot") — always use the methods above.
- **Low-res screenshots cause copy MISREADS.** Never "fix" Korean copy based on a
  screenshot — verify the string in source first.
- zsh reserves `path`/`status`/`UID` as variable names — don't use them in shell snippets.
- Don't run `next build` while `next dev` is live (corrupts `.next` — see `dev-env`).

## What to check (regression list from real iOS WebView bugs)

- Korean wraps at word boundaries only (`word-break: keep-all`).
- Content clear of notch/home-bar (safe-area insets on full-bleed/fixed elements).
- No new heavy GPU effects: backdrop-filter ≤14px, no full-screen mix-blend-mode,
  no large-blur infinite animations.
- Status/empty/loading states on each screen, not just the happy path.
