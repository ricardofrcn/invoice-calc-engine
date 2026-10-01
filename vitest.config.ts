import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/engine/**/*.ts"],
      exclude: ["src/engine/**/*.test.ts"],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
});
