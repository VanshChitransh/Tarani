import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html"],
      include: ["apps/**/src/**", "packages/**/src/**"],
      exclude: [
        "**/*.test.ts",
        "**/*.d.ts",
        "**/scenarios/testHelpers.ts",
        "apps/gilfoyle/scripts/**",
      ],
      // Ratchet floor set just under current coverage (lines/statements ~67%,
      // functions ~76%, branches ~87%). The gap — and the reason functions sits
      // lower — is the per-scenario `live` validator paths, which need a booted
      // solana-test-validator to exercise and so stay unit-untested by design.
      thresholds: {
        lines: 66,
        statements: 66,
        functions: 75,
        branches: 86,
      },
    },
  },
});
