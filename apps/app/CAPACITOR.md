# HGT as a native app (Capacitor)

The Next.js web app (`apps/app`) is wrapped as native **iOS + Android** apps via
Capacitor — same code, same glass design, plus native shell / push / app store.

Already done: `output: export` (gated by `BUILD_TARGET=capacitor`), `capacitor.config.ts`,
the `ios/` + `android/` native projects (`cap add`), and the web/backend side of push
(`@capacitor/push-notifications` installed, `src/lib/push.ts`, backend FCM sender).
What is NOT done yet: the native push wiring — see the runbook below.

## Status (native build engineer pass — 2026-06-15)

Capacitor core is **6.2.1** (the `^6.1.0` ranges resolve here). Migration to
Capacitor 7 is a separate, pre-store task — see the device-required list.

**Wired now (in-repo, verified by `cap sync`):**

- **Plugins added** (Capacitor 6.x compatible): `@capacitor/app@6.0.3`,
  `@capacitor/keyboard@6.0.4`, `@capacitor/status-bar@6.0.3` (plus the existing
  `@capacitor/push-notifications@6.0.5`). All four now appear in
  `ios/App/App/capacitor.config.json` `packageClassList`, in
  `android/.../assets/capacitor.plugins.json`, and as pods in `ios/App/Podfile`
  (`pod install` succeeded).
- **`components/native/NativeBridge.tsx`** — `"use client"`, mounted once in
  `providers.tsx`, **no-op on web** (every effect bails via
  `Capacitor.isNativePlatform()`):
  - Android hardware **back button**: `App.addListener('backButton')` →
    `router.back()` when there is in-app history and we're not on a top-level
    route (`/home`, `/signin`, `/`); otherwise `App.minimizeApp()`.
  - **StatusBar**: `setStyle(Light)` (white icons over coral) +
    `setOverlaysWebView({ overlay: false })` so the CSS safe-area padding owns
    the inset and the WebView is not drawn under the bar.
- **Keyboard resize = `native`** in `capacitor.config.ts`
  (`plugins.Keyboard.resize`). Rationale + the `Body` fallback are documented
  inline in that file — flip to `Body` only if the chat composer is clipped on a
  specific device.
- **iOS AppDelegate APNs callbacks** — the standard
  `didRegisterForRemoteNotificationsWithDeviceToken` /
  `didFailToRegisterForRemoteNotificationsWithError` pair, forwarding to
  `NotificationCenter` so the push plugin's JS `registration` event fires.
  (FirebaseMessaging pod is **not** installed on this machine, so only the
  NotificationCenter-forwarding pair is applied; the Firebase token bridge is
  device-required — see below.)
- **next.config.js warn-gate**: a `BUILD_TARGET=capacitor && !NEXT_PUBLIC_API_URL`
  build prints a loud warning (localhost default would otherwise ship). NOTE:
  `apps/app/.env.local` currently sets `NEXT_PUBLIC_API_URL=http://localhost:8080`,
  so the *local* export bakes in localhost (fine for the iOS simulator, dead on a
  real device) and the guard does **not** fire because the var is technically set.
  For device/store builds, pass an explicit `NEXT_PUBLIC_API_URL` (LAN IP / HTTPS).
- **Builds verified**: normal web `pnpm --filter app build` ✓ and
  `BUILD_TARGET=capacitor pnpm --filter app build` ✓ — `out/` exports all routes
  (index, signin, onboarding, home, conversations, conversations/chat, settings,
  safety, 404) as static HTML; `cap sync` copied them into both native projects
  (`.../public/conversations/chat.html` present on iOS + Android). appId
  `com.todari.hgt` unchanged on both platforms.

**Still device-required (cannot be done headless on this machine):**

1. **iOS Push capability + signing** — Xcode → target App → Signing &
   Capabilities → **+ Push Notifications** (creates `App.entitlements` with
   `aps-environment`); set a signing team. Commit the entitlements + pbxproj.
2. **iOS Firebase bridge** (this backend sends via FCM, not raw APNs) — add
   `pod 'FirebaseMessaging'` to the Podfile, `pod install`, then in
   `AppDelegate.swift` `import FirebaseCore`/`FirebaseMessaging`, call
   `FirebaseApp.configure()`, and **replace** the `didRegister…` callback with the
   Messaging-token version in the runbook (step 1.3). The NotificationCenter
   `didFailToRegister` callback stays as-is.
3. **Firebase config files** — `ios/App/App/GoogleService-Info.plist` (add via
   Xcode for target membership) and `android/app/google-services.json`. Backend
   needs `FIREBASE_SERVICE_ACCOUNT` set + restart.
4. **Icons / splash** — generate with `@capacitor/assets` (not yet run).
5. **Capacitor 7 migration** — required before store submission (Android API 35).
   Bump `@capacitor/*` to 7.x, re-`cap sync`, address breaking changes.

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

## Push notifications — wiring runbook

**State today (accurate as of this commit):**

- App side DONE: `@capacitor/push-notifications` is in `package.json`;
  `src/lib/push.ts` requests permission, registers the device token to the backend
  (`api.registerDevice`) after login, and deep-links on notification tap.
- Backend DONE: tokens stored in `device_tokens`; FCM sent on new match + new chat
  message (`apps/api/src/push/send.ts`) — a logged no-op until
  `FIREBASE_SERVICE_ACCOUNT` is set on the server.
- Native wiring NOT done: the steps below.

### 0. Re-run `cap sync` (plugin manifests are stale)

The native projects were last synced **before** the push plugin was installed, so
all three generated plugin manifests still claim "no plugins":

- `ios/App/Podfile` — the `capacitor_pods` section is missing
  `pod 'CapacitorPushNotifications'`
- `ios/App/App/capacitor.config.json` — `"packageClassList": []`
- `android/app/src/main/assets/capacitor.plugins.json` — `[]`

`npx cap sync` (our `pnpm --filter app cap:sync`) regenerates all three (and runs
`pod install`). The Podfile change is committed; the other two are gitignored
synced artifacts. Without this step the JS bridge never loads the plugin and
`PushNotifications.register()` silently does nothing.

```bash
pnpm --filter app build:app && pnpm --filter app cap:sync
```

(Sync also rewrites the Podfile's `node_modules/.pnpm/...` paths when Capacitor is
bumped — expected, commit it.)

### 1. iOS — APNs entitlement + AppDelegate

1. Xcode → target `App` → *Signing & Capabilities* → **+ Capability → Push
   Notifications**. This creates `App/App.entitlements` with the
   **`aps-environment`** key (`development`; App Store / TestFlight builds get
   `production` automatically at submission). Commit the entitlements file and the
   pbxproj change.
2. Add the two standard APNs callbacks to `ios/App/App/AppDelegate.swift` (today it
   has neither — without them the plugin's `registration` event never fires):

```swift
func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
}

func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
}
```

3. **FCM caveat — required for this backend.** The snippet above forwards the raw
   **APNs** token, but `apps/api` sends with firebase-admin
   (`sendEachForMulticast`), which only accepts **FCM registration tokens**. On iOS
   you must therefore bridge through Firebase:
   - Apple Developer → create an **APNs Auth Key** (.p8) → upload it in the
     Firebase console (Project settings → Cloud Messaging → Apple app).
   - Add `pod 'FirebaseMessaging'` under `# Add your Pods here` in
     `ios/App/Podfile`, run `pod install` (from `ios/App/`).
   - In `AppDelegate.swift`: `import FirebaseCore` + `import FirebaseMessaging`,
     call `FirebaseApp.configure()` in `didFinishLaunchingWithOptions`, and
     **replace** the register callback from step 2 with:

```swift
func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
    Messaging.messaging().token { token, error in
        if let error = error {
            NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
        } else if let token = token {
            NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: token)
        }
    }
}
```

   (Keep the `didFailToRegister` method from step 2 as-is.)
4. Download **`GoogleService-Info.plist`** for the iOS app `com.todari.hgt` from the
   Firebase console and place it at `ios/App/App/GoogleService-Info.plist` — add it
   via Xcode (File → Add Files to "App") so it gets target membership.

### 2. Android — FCM config file only

- Download **`google-services.json`** for the Android app `com.todari.hgt` and drop
  it at `android/app/google-services.json`. That's all:
  `android/app/build.gradle` already applies the `com.google.gms.google-services`
  plugin automatically when the file exists (and logs *"google-services.json not
  found … Push Notifications won't work"* when it doesn't).
- The Android 13+ runtime notification permission is already handled by
  `PushNotifications.requestPermissions()` in `src/lib/push.ts`.

### 3. Backend switch-on

Set `FIREBASE_SERVICE_ACCOUNT` (one-line service-account JSON) in `apps/api/.env`
on the server and restart `hgt-api` (see `DEPLOY.md`).

### 4. Verify

Real APNs delivery needs a **physical iPhone** (simulators don't receive real
remote pushes). Install on device, log in, then trigger a push: send a chat
message from the other account of a matched pair, or run
`POST /admin/match/run` (X-Admin-Token) — both paths call `sendPush()`.

## Notes

- `ios/` and `android/` are committed (Capacitor convention). Their own
  `.gitignore`s exclude Pods / Gradle build artifacts, the synced web assets
  (`ios/App/App/public`, `android/app/src/main/assets/public`) and the generated
  configs (`capacitor.config.json`, `capacitor.plugins.json`). `out/` is gitignored.
- App id: `com.todari.hgt`, name `HGT` (edit in `capacitor.config.ts`).
- Store submission blockers (API 35 / Capacitor 7, icons, demo account, …):
  see `docs/launch-checklist.md`.
