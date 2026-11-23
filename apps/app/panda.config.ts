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
            50: { value: "#f1ede3" },
            100: { value: "#e5dfd2" },
            300: { value: "#9a9488" },
            500: { value: "#68635b" },
            700: { value: "#37342f" },
            900: { value: "#1e1d1a" },
            950: { value: "#11110f" },
          },
          primary: {
            50: { value: "#fff0ec" },
            100: { value: "#ffd3ca" },
            200: { value: "#ffad9f" },
            300: { value: "#ff7d6c" },
            500: { value: "#ff4f3f" },
            600: { value: "#d93629" },
            700: { value: "#b9261c" },
            900: { value: "#681811" },
          },
          accent: {
            blue: { value: "#9fd6ff" },
            yellow: { value: "#ffe14f" },
            mint: { value: "#a9e8c4" },
          },
          surface: {
            card: { value: "#fffaf0" },
            paper: { value: "#f6f0e4" },
            hairline: { value: "rgba(17, 17, 15, 0.18)" },
            strong: { value: "#11110f" },
          },
          glass: {
            clear: { value: "rgba(255, 250, 240, 0.72)" },
            milk: { value: "rgba(255, 250, 240, 0.9)" },
            frost: { value: "rgba(246, 240, 228, 0.9)" },
            stroke: { value: "rgba(17, 17, 15, 0.22)" },
            hairline: { value: "rgba(17, 17, 15, 0.18)" },
          },
        },
        radii: {
          liquid: { value: "14px" },
          vessel: { value: "18px" },
          capsule: { value: "999px" },
        },
        shadows: {
          cardSoft: { value: "0 12px 30px rgba(73, 48, 38, 0.10)" },
          glassFloat: { value: "4px 4px 0 #11110f" },
          glassLift: { value: "3px 3px 0 #11110f" },
          glassInset: { value: "inset 0 0 0 1px rgba(17,17,15,.12)" },
          actionGlow: { value: "5px 5px 0 #11110f" },
        },
      },
    },
  },

  syntax: "object-literal",
  jsxFramework: "react",

  outdir: "styled-system",
});
