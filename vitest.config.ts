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
      // Ratchet floor set just under current coverage (lines/statements ~66%,
      // functions ~80%, branches ~86%). It can only be raised, never lowered.
      // The gap is the kotler `live` validator paths, which need an integration
      // test that boots solana-test-validator to lift further.
      thresholds: {
        lines: 65,
        statements: 65,
        functions: 78,
        branches: 84,
      },
    },
  },
});
