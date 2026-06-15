/** @type {import('next').NextConfig} */
const isCapacitor = process.env.BUILD_TARGET === "capacitor";

// Guard the #1 native gotcha: NEXT_PUBLIC_API_URL is baked in at build time and
// a packaged app can't reach the Mac's localhost. Warn loudly (don't fail) when
// a Capacitor bundle is about to ship with the localhost default — a phone build
// that points at localhost looks "working" in the simulator but is dead on a
// real device / in the store.
if (isCapacitor && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    "\n\x1b[33m⚠ [capacitor build] NEXT_PUBLIC_API_URL is unset — the bundle will " +
      "bake in the localhost default (http://localhost:8080).\n" +
      "  A packaged phone build cannot reach your Mac's localhost; set " +
      "NEXT_PUBLIC_API_URL to a LAN IP (device) or your deployed HTTPS backend (store).\n" +
      "  e.g. NEXT_PUBLIC_API_URL=https://api.example.com pnpm --filter app build:app\x1b[0m\n",
  );
}

const nextConfig = {
  // Workspace packages ship TypeScript source, so Next must transpile them.
  transpilePackages: ["@hgt-client/contract", "@hgt-client/ui"],
  // For the native (Capacitor) build only, emit a static SPA into `out/`.
  // Normal `next dev` / Vercel builds are unaffected.
  ...(isCapacitor ? { output: "export", images: { unoptimized: true } } : {}),
};

export default nextConfig;
