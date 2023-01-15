// import legacy from '@vitejs/plugin-legacy';
import { defineNuxtConfig } from 'nuxt/config';
const SITE_URL = process.env.SITE_URL || 'https://www.urinest.rip/';

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  typescript: {
    shim: false,
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'nl',
      },
      charset: 'utf-16',
      title: 'urinest.rip - Interpretatie van urineonderzoek',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Makkelijk uitslagen van urine onderzoek interpreteren aan de hand van oa. de NHG-standaard urineweginfecties. Gemaakt door een huisarts voor zorgverleners die met de interpretatie urineonderzoek te maken hebben.',
        },
      ],
      script: [
        {
          type: 'module',
          src: 'https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js',
        },
      ],
      noscript: [
        // <noscript>Javascript is required</noscript>
        { children: 'Javascript is required' },
      ],
    },
  },

  css: [
    // SCSS file in the project
    '@/assets/main.scss',
  ],

  pwa: {
    manifest: {
      name: 'Urinest.rip',
      short_name: 'Urinest.rip',
      description:
        'Makkelijk uitslagen van urine onderzoek interpreteren aan de hand van oa. de NHG-standaard urineweginfecties. Gemaakt door een huisarts voor zorgverleners die met de interpretatie urineonderzoek te maken hebben.',
      theme_color: '#22c55e',
      start_url: '/?ref=pwa',
      background_color: '#f9f6fb',
      display: 'standalone',
    },

    icon: {
      source: './public/icon.png',
    },

    meta: {
      name: 'Urinest.rip - Martien Oranje',
      author: 'Martien Oranje',
      mobileAppIOS: true,
      ogHost: SITE_URL,
    },
  },

  tailwindcss: {
    configPath: 'tailwind.config.js',
  },

  googleFonts: {
    download: true,
    families: {
      Inter: true,
    },
  },

  modules: [
    '@nuxtjs/tailwindcss',
    [
      '@pinia/nuxt',
      {
        autoImports: [
          // automatically imports `usePinia()`
          'defineStore',
        ],
      },
    ],
    '@pinia-plugin-persistedstate/nuxt',
    '@kevinmarrec/nuxt-pwa',
  ],

  buildModules: ['@nuxtjs/google-fonts'],

  vue: {
    compilerOptions: {
      isCustomElement: (tag) => ['ion-icon'].includes(tag),
    },
  },
});
