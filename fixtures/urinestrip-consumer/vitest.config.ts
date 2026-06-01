import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@beslismodel/compiler": new URL("../../packages/compiler/dist/index.js", import.meta.url)
        .pathname,
      "@beslismodel/core": new URL("../../packages/core/dist/index.js", import.meta.url).pathname,
      "@beslismodel/vue": new URL("../../packages/vue/dist/index.js", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    include: ["fixtures/urinestrip-consumer/src/**/*.test.ts"],
  },
});
