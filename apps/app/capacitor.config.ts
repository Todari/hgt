import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "com.todari.hgt",
  appName: "HGT",
  // The static SPA produced by `pnpm --filter app build:app` (output: export).
  webDir: "out",
  plugins: {
    Keyboard: {
      // `Native` lets the OS slide the whole WebView up so the focused chat
      // composer stays visible without us reflowing the layout (which would
      // fight the safe-area / fixed TabBar). If the chat input is ever clipped
      // on a specific device, fall back to `Body` (resizes the document body
      // instead) — documented here so the choice is explicit.
      resize: KeyboardResize.Native,
    },
  },
};

export default config;
