import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx|js|jsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/vue3-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  docs: {
    defaultName: "Documentation",
  },
  typescript: {
    check: false,
  },
  // Storybook erft de root vite-config; PWA + decision-engine zijn niet
  // nodig (en breken) in Storybook. Strip ze hier expliciet uit.
  viteFinal: async (cfg) => {
    const stripNames = new Set([
      "vite-plugin-pwa",
      "vite-plugin-pwa:info",
      "vite-plugin-pwa:build",
      "vite-plugin-pwa:dev-sw",
      "vite-plugin-pwa:pwa-assets",
      "vite:compression",
      "vite-plugin-decision-engine",
    ]);
    const flat = (plugins: unknown[]): unknown[] =>
      plugins.flatMap((p) => (Array.isArray(p) ? flat(p) : [p]));
    cfg.plugins = flat(cfg.plugins ?? []).filter((plugin) => {
      if (!plugin || typeof plugin !== "object") return Boolean(plugin);
      const name = (plugin as { name?: string }).name ?? "";
      return !stripNames.has(name);
    }) as typeof cfg.plugins;
    return cfg;
  },
};

export default config;
