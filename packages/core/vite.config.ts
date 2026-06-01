import { defineConfig } from "vite";

export default defineConfig({
  publicDir: false,
  build: {
    emptyOutDir: true,
    lib: {
      entry: new URL("./src/index.ts", import.meta.url).pathname,
      formats: ["es"],
      fileName: () => "index.js",
    },
    outDir: new URL("./dist", import.meta.url).pathname,
    sourcemap: true,
  },
});
