import { defineConfig } from "vite";

export default defineConfig({
  publicDir: false,
  resolve: {
    alias: {
      "@beslismodel/core": new URL("../core/src/index.ts", import.meta.url).pathname,
    },
  },
  build: {
    emptyOutDir: true,
    lib: {
      entry: new URL("./src/index.ts", import.meta.url).pathname,
      formats: ["es"],
      fileName: () => "index.js",
    },
    outDir: new URL("./dist", import.meta.url).pathname,
    rollupOptions: {
      external: ["pinia", "vue", "vue-router"],
    },
    sourcemap: true,
  },
});
