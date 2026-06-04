import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@beslismodel/compiler": new URL("./packages/compiler/src/index.ts", import.meta.url)
        .pathname,
      "@beslismodel/copd-care": new URL("./packages/copd-care/src/index.ts", import.meta.url)
        .pathname,
      "@beslismodel/core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "@beslismodel/cvrm-prevent": new URL("./packages/cvrm-prevent/src/index.ts", import.meta.url)
        .pathname,
      "@beslismodel/dm-care": new URL("./packages/dm-care/src/index.ts", import.meta.url).pathname,
      "@beslismodel/testing": new URL("./packages/testing/src/index.ts", import.meta.url).pathname,
      "@beslismodel/vue": new URL("./packages/vue/src/index.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    include: ["packages/**/*.test.ts"],
  },
});
