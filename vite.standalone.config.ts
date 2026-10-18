// The one-file build: dist/bargrids.min.js, with hexword and its YAML parser inside, for a plain <script> tag.
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: { entry: "src/standalone.ts", name: "BarGrids", formats: ["iife"], fileName: () => "bargrids.min.js" },
    emptyOutDir: false,
    minify: true,
    sourcemap: true,
  },
});
