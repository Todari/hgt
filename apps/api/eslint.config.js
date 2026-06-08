import { config } from "@hgt-client/eslint-config/base";

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    ignores: ["dist/**", "drizzle/**"],
  },
];
