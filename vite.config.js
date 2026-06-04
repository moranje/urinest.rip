import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { decisionEngine } from "@beslismodel/compiler";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
const designTokens = require("./src/styles/beslismodel.tokens.json");
const themeTokens = designTokens.$extensions["wtf.oranje.beslismodel"].theme;

export default defineConfig({
  build: {
    sourcemap: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(
      (() => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
      })(),
    ),
  },
  plugins: [
    vue(),
    decisionEngine(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.ico", "droplet.svg", "apple-touch-icon.png"],
      manifest: {
        name: "urinest.rip — Beslishulp urineonderzoek",
        short_name: "urinest.rip",
        description: "Beslishulp urineonderzoek voor huisartsen",
        theme_color: themeTokens.themeColor.light,
        background_color: themeTokens.backgroundColor.light,
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,json,png,ico}"],
        navigateFallback: "/index.html",
      },
    }),
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
    }),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
    }),
  ],
});
