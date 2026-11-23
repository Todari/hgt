# HGT as a native app (Capacitor)

The Next.js web app (`apps/app`) is wrapped as native **iOS + Android** apps via
Capacitor — same code, same glass design, plus native shell / push / app store.

Already done: `output: export` (gated by `BUILD_TARGET=capacitor`), `capacitor.config.ts`,
the `ios/` + `android/` native projects (`cap add`), the Firebase client setup, and
the web/backend push code. Apple/Firebase Console credentials are the remaining
external setup; see the runbook below.

## Status (native build + Firebase pass — 2026-08-03)

Capacitor core/cli/ios/android are **8.6.2** (migrated 6 → 7 → 8 on 2026-11-23
with `cap migrate`).

| | Value |
| --- | --- |
| Android | `minSdk 24`, `compileSdk 36`, `targetSdk 36` (`android/variables.gradle`), AGP 8.13.0, Gradle wrapper 8.14.3 |
| iOS | deployment target **15.0** (pbxproj + `Podfile`), CocoaPods project |
| Toolchain | Node 22+, **Xcode 26+**, Android Studio Otter 2025.2.1+, **JDK 21** for Gradle |

The default `java` on a dev Mac may be 17, which is too old for the Android
build (`capacitor.build.gradle` compiles with `JavaVersion.VERSION_21`). Point
Gradle at Android Studio's bundled JBR instead of installing another JDK:

```bash
cd apps/app/android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug
```

**Wired now (in-repo, verified by `cap sync`):**

- **Plugins** (Capacitor 8.x): `@capacitor/app@8.1.2`,
  `@capacitor/keyboard@8.0.6`, `@capacitor/status-bar@8.0.4`,
  `@capacitor/push-notifications@8.1.3`. All four appear in
  `ios/App/App/capacitor.config.json` `packageClassList`, in
  `android/.../assets/capacitor.plugins.json`, and as pods in `ios/App/Podfile`
  (`pod install` succeeded).
- **`components/native/NativeBridge.tsx`** — `"use client"`, mounted once in
  `providers.tsx`, **no-op on web** (every effect bails via
  `Capacitor.isNativePlatform()`):
  - Android hardware **back button**: `App.addListener('backButton')` →
    `router.back()` when there is in-app history and we're not on a top-level
    route (`/home`, `/signin`, `/`); otherwise `App.minimizeApp()`.
  - **StatusBar**: `setStyle(Light)`, plus `setOverlaysWebView({ overlay: false })`
    on Android. With `targetSdk 36` that overlay call only still applies on
    Android ≤ 14 devices: Android 15+ enforces edge-to-edge, so the WebView is
    drawn under the status/navigation bars and Capacitor 8's core `SystemBars`
    plugin (default `insetsHandling: "css"`) feeds the real insets to
    `env(safe-area-inset-*)`. The layout relies on `viewport-fit=cover` + those
    `env()` paddings — do not remove either.
- **iOS UIScene lifecycle** (required by Xcode 27, adopted in Capacitor 8.5):
  `ios/App/App/SceneDelegate.swift` builds the window in code and must
  instantiate **`HGTBridgeViewController`** (the native tab bar host), not the
  stock `CAPBridgeViewController`. URL opens / universal links now arrive via
  the scene delegate; `AppDelegate` keeps launch + remote-notification callbacks.
- **Keyboard resize = `native`** in `capacitor.config.ts`
  (`plugins.Keyboard.resize`). Rationale + the `Body` fallback are documented
  inline in that file — flip to `Body` only if the chat composer is clipped on a
  specific device.
- **Firebase client wiring** — Firebase apps are registered for
  `com.todari.hgt` in project `hgtt-e0a99`; the matching
  `GoogleService-Info.plist` and `google-services.json` live in their native
  projects but are **gitignored** (public repo) — download them from the
  Firebase console on a fresh clone; the iOS build fails without the plist. iOS installs `FirebaseMessaging`, configures Firebase in
  `AppDelegate`, maps the APNs token to an FCM registration token, and forwards
  it to the Capacitor push plugin. `App.entitlements` and the Xcode Push
  Notifications capability are versioned.
- **Push re-registration** — `components/push/PushBootstrap.tsx` re-registers a
  previously opted-in device after login/session rotation, keeping the backend
  token association current.
- **next.config.js native API gate**: a Capacitor build now fails when
  `NEXT_PUBLIC_API_URL` is missing or points at localhost, instead of shipping a
  bundle that cannot work on a real phone. Simulator-only builds must also set
  `CAPACITOR_ALLOW_LOCAL_API=true`.
- **Builds verified** (on Capacitor 8, 2026-11-23): production API Capacitor
  export + `cap sync` ✓, an unsigned iOS Simulator Xcode build with Firebase
  Messaging ✓ (Xcode 27.2), and Android `assembleDebug` ✓ (JDK 21, merged
  manifest `targetSdkVersion 36`). `out/` includes the waitlist route as well as
  the native app routes. appId `com.todari.hgt` is unchanged on both platforms.
  Runtime QA (2026-11-23): launched and driven in the iOS 27 simulator, Android
  API 34/36 emulators, and two physical iPhones against the production API —
  launch, demo login, native tab bar, keyboard, back button, resume all pass.
  Push registration is still unverified (needs a paid Apple Developer team).

**Still requires account/console setup:**

1. **Apple signing/profile refresh** — enable Push Notifications for the
   `com.todari.hgt` App ID in Apple Developer using team `WNMJ4J8S4S`, then
   regenerate/download the provisioning profile. Until this is done, the current
   provisioning profile rejects the versioned `aps-environment` entitlement.
2. **APNs key in Firebase** — create or reuse an APNs Auth Key (`.p8`) and upload
   it to Firebase Console → Project settings → Cloud Messaging → the
   `com.todari.hgt` Apple app.
3. **Backend credential** — set `FIREBASE_SERVICE_ACCOUNT` on the API server and
   restart `hgt-api`. Do not commit the service-account JSON.
4. **Physical-device delivery test** — rebuild/install after steps 1–3, log in,
   allow notifications, and send a message from the matched account.
5. **Icons / splash** — generate with `@capacitor/assets` (not yet run).
6. **Capacitor 8 device QA** — the migration is only build-verified. On real
   devices check: Android edge-to-edge layout (status bar / gesture + 3-button
   nav insets, Android 14 vs 15+), Android keyboard over the chat composer, iOS
   launch through the scene delegate with the native tab bar, iOS keyboard
   resize, and push registration on both platforms.

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
| iOS Simulator | `http://localhost:8080` plus `CAPACITOR_ALLOW_LOCAL_API=true` |
| Android Emulator | `http://10.0.2.2:8080` (host alias) |
| Physical device (same Wi-Fi) | `http://<your-mac-LAN-IP>:8080` |
| Production | `https://<deployed-backend>` |

```bash
CAPACITOR_ALLOW_LOCAL_API=true NEXT_PUBLIC_API_URL=http://10.0.2.2:8080 \
  pnpm --filter app build:app && pnpm --filter app cap:sync
```

The backend already allows the Capacitor origins (`capacitor://localhost`,
`http(s)://localhost`) in CORS — **restart `apps/api`** to apply.

> For real device / store use you need the backend reachable over HTTPS — deploy
> it (see `DEPLOY.md`) and point `NEXT_PUBLIC_API_URL` at that.

## Push notifications — wiring runbook

**State today (2026-08-03):**

- App side DONE: `@capacitor/push-notifications` is in `package.json`;
  `src/lib/push.ts` requests permission, registers the device token to the backend
  (`api.registerDevice`) after login, and deep-links on notification tap.
- Backend DONE: tokens stored in `device_tokens`; FCM sent on new match + new chat
  message (`apps/api/src/push/send.ts`) — a logged no-op until
  `FIREBASE_SERVICE_ACCOUNT` is set on the server.
- Native client DONE: `cap sync`, Firebase config files, FirebaseMessaging pod,
  AppDelegate FCM bridge, and iOS entitlement/capability are all versioned.
- External credentials PENDING: Apple provisioning/profile refresh, APNs key
  upload to Firebase, and the API server service account.

### 1. iOS — finish Apple-side push setup

1. Apple Developer → Certificates, Identifiers & Profiles → Identifiers →
   `com.todari.hgt` → enable **Push Notifications**.
2. Regenerate the development provisioning profile, or let Xcode automatic
   signing recreate it after selecting team `WNMJ4J8S4S`.
3. Create/reuse an APNs Auth Key (`.p8`) and upload it with its Key ID and Team ID
   in Firebase Console → Project settings → Cloud Messaging → Apple app.
4. Build on a physical iPhone. A successful signed build confirms the profile
   contains the `aps-environment` entitlement.

### 2. Android — client configured

- **`google-services.json`** for `com.todari.hgt` goes at
  `android/app/google-services.json` (gitignored, local-only):
  `android/app/build.gradle` already applies the `com.google.gms.google-services`
  plugin automatically when the file exists (and logs *"google-services.json not
  found … Push Notifications won't work"* when it doesn't).
- The Android 13+ runtime notification permission is already handled by
  `PushNotifications.requestPermissions()` in `src/lib/push.ts`.

### 3. Backend switch-on (pending external secret)

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
- Store submission blockers (icons, demo account, …): see
  `docs/launch-checklist.md`. The Android target-API blocker is cleared by the
  Capacitor 8 migration (`targetSdk 36`).

### Device builds with a free Personal Team

A Personal Team cannot sign the Push Notifications capability, so a plain
device build fails provisioning. For a QA build, point the entitlements at an
empty plist instead of editing the project (an empty string is ignored):

```bash
printf '<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0"><dict/></plist>\n' > /tmp/empty.entitlements
xcodebuild … -allowProvisioningUpdates CODE_SIGN_ENTITLEMENTS=/tmp/empty.entitlements build
```

Push does not work in such a build. Deleting the app drops the developer trust
on the phone, so reinstall over it instead.

### Launch screen changes need a reboot to verify

`splashboardd` caches launch images per app; after changing `Splash.imageset`
restart the device (or erase the simulator) before judging the result. Keep the
launch image at 2048×2048 or smaller — larger images exceed the launch-image
memory limit and iOS shows a black screen instead.

### Android emulator against a local API

The WebView origin is `https://localhost`, so a local `http://10.0.2.2:8080`
API is blocked as cleartext/mixed content. For emulator-only work add
`server.cleartext: true` and `android.allowMixedContent: true` to
`capacitor.config.ts`, sync, and revert before committing.
