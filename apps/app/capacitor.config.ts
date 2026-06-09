import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.todari.hgt",
  appName: "HGT",
  // The static SPA produced by `pnpm --filter app build:app` (output: export).
  webDir: "out",
};

export default config;
