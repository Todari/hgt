import { nextJsConfig } from "@hgt-client/eslint-config/next-js";

/** @type {import("eslint").Linter.Config} */
export default [
  {
    ignores: [
      ".next/**",
      "styled-system/**",
      "next-env.d.ts",
      "postcss.config.cjs",
    ],
  },
  ...nextJsConfig,
];
