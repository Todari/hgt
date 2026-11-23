/** @type {import('next').NextConfig} */
const isCapacitor = process.env.BUILD_TARGET === "capacitor";

// Guard the #1 native gotcha: the API URL is baked into the bundle. A localhost
// bundle works in the simulator but can never reach the Mac from a real phone.
// Simulator-only builds may opt in explicitly.
const nativeApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const allowsLocalNativeApi =
  process.env.CAPACITOR_ALLOW_LOCAL_API === "true";
const isLocalNativeApi =
  !nativeApiUrl ||
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/.test(nativeApiUrl);

if (isCapacitor && isLocalNativeApi && !allowsLocalNativeApi) {
  throw new Error(
    "\n[capacitor build] Refusing to bake a localhost API URL into a native bundle.\n" +
      "Set NEXT_PUBLIC_API_URL to the deployed HTTPS API. For simulator-only work, " +
      "also set CAPACITOR_ALLOW_LOCAL_API=true.\n",
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
