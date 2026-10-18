import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: { entry: "src/index.ts", name: "BarGrids", formats: ["es"], fileName: () => "bargrids.js" },
    rollupOptions: { external: ["hexword"] },
    sourcemap: true,
  },
  test: { include: ["tests/**/*.test.ts"] },
});
