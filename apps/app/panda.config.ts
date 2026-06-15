import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,

  include: ["./src/**/*.{js,jsx,ts,tsx}", "../../packages/ui/src/**/*.{js,jsx,ts,tsx}"],

  exclude: [],

  theme: {
    extend: {
      tokens: {
        colors: {
          ink: {
            50: { value: "#f6f8f9" },
            100: { value: "#e7ecef" },
            300: { value: "#a8b5bf" },
            500: { value: "#5e6f7a" },
            700: { value: "#293843" },
            900: { value: "#121a24" },
            950: { value: "#0a1118" },
          },
          primary: {
            50: { value: "#fff5f2" },
            100: { value: "#ffe2db" },
            200: { value: "#ffc6bb" },
            300: { value: "#ff9a87" },
            500: { value: "#ff6b5f" },
            // Darkest coral that still reads "coral"; the LIGHT end of any
            // white-text gradient must not go above this (≥4.5:1 vs white).
            600: { value: "#d0463c" },
            700: { value: "#b83e3a" },
            900: { value: "#6e201f" },
          },
          // Solid content surfaces (cards). True glass is reserved for nav
          // chrome / floating accents — see GlassPanel's `variant` prop.
          surface: {
            card: { value: "rgba(255, 255, 255, 0.92)" },
            hairline: { value: "rgba(15, 25, 35, 0.1)" },
          },
          glass: {
            clear: { value: "rgba(255, 255, 255, 0.42)" },
            milk: { value: "rgba(255, 255, 255, 0.66)" },
            frost: { value: "rgba(243, 249, 248, 0.78)" },
            stroke: { value: "rgba(255, 255, 255, 0.72)" },
            hairline: { value: "rgba(19, 31, 42, 0.12)" },
          },
        },
        radii: {
          liquid: { value: "24px" },
          vessel: { value: "32px" },
          capsule: { value: "999px" },
        },
        shadows: {
          // The one card shadow: single soft layer (replaces the 4–6-layer
          // coral stacks on content surfaces).
          cardSoft: { value: "0 6px 24px rgba(17, 24, 32, 0.08)" },
          glassFloat: {
            value:
              "0 1px 0 rgba(255, 255, 255, 0.76) inset, 0 -1px 0 rgba(21, 38, 51, 0.08) inset, 0 24px 60px rgba(17, 40, 52, 0.15), 0 14px 38px rgba(255, 107, 95, 0.18), -18px 16px 46px rgba(255, 107, 95, 0.1), 18px -18px 38px rgba(255, 107, 95, 0.08)",
          },
          glassLift: {
            value:
              "0 1px 0 rgba(255, 255, 255, 0.82) inset, 0 18px 38px rgba(10, 17, 24, 0.13), 0 8px 24px rgba(255, 107, 95, 0.18), 14px -10px 28px rgba(255, 107, 95, 0.1)",
          },
          glassInset: {
            value:
              "0 1px 0 rgba(255, 255, 255, 0.84) inset, 0 -1px 0 rgba(10, 17, 24, 0.06) inset, 0 0 0 1px rgba(255, 255, 255, 0.38) inset",
          },
          actionGlow: {
            value:
              "0 1px 0 rgba(255, 255, 255, 0.58) inset, 0 22px 48px rgba(255, 107, 95, 0.32), -14px 16px 36px rgba(255, 107, 95, 0.18), 16px -14px 32px rgba(255, 107, 95, 0.14)",
          },
        },
      },
    },
  },

  syntax: "object-literal",
  jsxFramework: "react",

  outdir: "styled-system",
});
