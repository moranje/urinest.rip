import { defineConfig } from "vite";

const entries = {
  cli: new URL("./src/cli.ts", import.meta.url).pathname,
  index: new URL("./src/index.ts", import.meta.url).pathname,
};

export default defineConfig({
  publicDir: false,
  build: {
    emptyOutDir: true,
    lib: {
      entry: entries,
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: new URL("./dist", import.meta.url).pathname,
    rollupOptions: {
      external: [
        "node:fs/promises",
        "node:path",
        "node:process",
        "ajv",
        "ajv/dist/2020.js",
        "ajv-formats",
        "glob",
        "js-yaml",
        "picocolors",
      ],
    },
    sourcemap: true,
  },
});
