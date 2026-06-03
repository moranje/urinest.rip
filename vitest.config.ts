import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@beslismodel/copd-care": new URL("./packages/copd-care/src/index.ts", import.meta.url)
        .pathname,
      "@beslismodel/cvrm-prevent": new URL("./packages/cvrm-prevent/src/index.ts", import.meta.url)
        .pathname,
      "@beslismodel/core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "@beslismodel/dm-care": new URL("./packages/dm-care/src/index.ts", import.meta.url).pathname,
      "@beslismodel/testing": new URL("./packages/testing/src/index.ts", import.meta.url).pathname,
      "@beslismodel/vue": new URL("./packages/vue/src/index.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    include: ["src/**/*.test.ts", "packages/**/*.test.ts", "scripts/**/*.test.mjs"],
  },
});
