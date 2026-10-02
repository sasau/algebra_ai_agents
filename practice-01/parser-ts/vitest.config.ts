import { defineConfig } from "vitest/config";

// Deliberately minimal. `npm test` runs `vitest run` (one pass, no watch mode),
// which is what an agent needs: a command that exits with 0 or 1.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
  },
});
