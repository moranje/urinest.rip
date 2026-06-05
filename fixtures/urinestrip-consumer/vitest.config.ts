import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    include: ["fixtures/urinestrip-consumer/src/**/*.test.ts"],
  },
});
