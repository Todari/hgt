# HGT as a native app (Capacitor)

The Next.js web app (`apps/app`) is wrapped as native **iOS + Android** apps via
Capacitor — same code, same glass design, plus native shell / push / app store.

Already done: `output: export` (gated by `BUILD_TARGET=capacitor`), `capacitor.config.ts`,
and the `ios/` + `android/` native projects (`cap add`).

## Build & run

```bash
# 1. build the static web bundle  (-> apps/app/out)
pnpm --filter app build:app

# 2. copy it into the native projects
pnpm --filter app cap:sync

# 3. open & run
pnpm --filter app cap:ios       # Xcode -> Run (▶)
pnpm --filter app cap:android   # Android Studio -> Run
```

Repeat 1–2 after any web change (or `cap:sync` watches nothing — rebuild + sync).

## ⚠️ API URL (the #1 gotcha)

`NEXT_PUBLIC_API_URL` is **baked in at `build:app` time**, and a phone can't reach
your Mac's `localhost`. Set it for your target before building:

| Target | NEXT_PUBLIC_API_URL |
| ------ | ------------------- |
| iOS Simulator | `http://localhost:8080` (shares the Mac network) |
| Android Emulator | `http://10.0.2.2:8080` (host alias) |
| Physical device (same Wi-Fi) | `http://<your-mac-LAN-IP>:8080` |
| Production | `https://<deployed-backend>` |

```bash
NEXT_PUBLIC_API_URL=http://10.0.2.2:8080 pnpm --filter app build:app && pnpm --filter app cap:sync
```

The backend already allows the Capacitor origins (`capacitor://localhost`,
`http(s)://localhost`) in CORS — **restart `apps/api`** to apply.

> For real device / store use you need the backend reachable over HTTPS — deploy
> it (see `DEPLOY.md`) and point `NEXT_PUBLIC_API_URL` at that.

## Next: push notifications (the "natural app" part)

The matching/chat experience feels native mainly via push. To add:
1. `pnpm --filter app add @capacitor/push-notifications`
2. iOS: APNs key (Apple Developer) · Android: Firebase (FCM) config
3. Register the device token to the backend, store per user
4. Trigger pushes on **new match** and **new chat message** (backend work)

(Chat itself = a `messages` table + WebSocket on the backend — client-agnostic.)

## Notes
- `ios/` and `android/` are committed (Capacitor convention); their own
  `.gitignore`s exclude Pods / Gradle build artifacts. `out/` is gitignored.
- App id: `com.todari.hgt`, name `HGT` (edit in `capacitor.config.ts`).
