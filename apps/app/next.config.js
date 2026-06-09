/** @type {import('next').NextConfig} */
const isCapacitor = process.env.BUILD_TARGET === "capacitor";

const nextConfig = {
  // Workspace packages ship TypeScript source, so Next must transpile them.
  transpilePackages: ["@hgt-client/contract", "@hgt-client/ui"],
  // For the native (Capacitor) build only, emit a static SPA into `out/`.
  // Normal `next dev` / Vercel builds are unaffected.
  ...(isCapacitor ? { output: "export", images: { unoptimized: true } } : {}),
};

export default nextConfig;
