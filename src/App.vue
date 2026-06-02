<template>
  <div id="app">
    <a href="#main-content" class="skip-link">Naar inhoud springen</a>
    <app-header :droplet-animate="dropletAnimate" />
    <main id="main-content" class="app-content" tabindex="-1">
      <section v-if="appError" class="app-error" role="alert" aria-live="assertive">
        <h1>Er ging iets mis</h1>
        <p>{{ appError }}</p>
        <Button @click="reloadApp">Opnieuw laden</Button>
      </section>
      <router-view v-else v-slot="{ Component, route: r }">
        <component :is="Component" :key="routeViewKey(r)" />
      </router-view>
    </main>
    <OfflineBanner />
    <ToastContainer />
    <UpdatePrompt />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onErrorCaptured } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "./components/organisms/AppHeader.vue";
import ToastContainer from "./components/ToastContainer.vue";
import UpdatePrompt from "./components/UpdatePrompt.vue";
import OfflineBanner from "./components/OfflineBanner.vue";
import Button from "./components/primitives/Button.vue";
import { useQuestionnaireStore } from "./store/questionnaireStore";
import { useThemeStore } from "./store/themeStore";
import { handleError } from "./lib/errors";

const route = useRoute();
const questionnaireStore = useQuestionnaireStore();
const themeStore = useThemeStore();

const dropletAnimate = ref(false);
const appError = ref<string | null>(null);

const routeViewKey = (viewRoute: { readonly fullPath: string; readonly name?: unknown }): string =>
  viewRoute.name === "Questionnaire" ? "questionnaire" : viewRoute.fullPath;

watch(
  () => route.path,
  () => {
    dropletAnimate.value = false;
    requestAnimationFrame(() => {
      dropletAnimate.value = true;
    });
  },
);

onMounted(async () => {
  try {
    await questionnaireStore.loadInitialData();
  } catch {
    // loadInitialData reports via telemetry; App only keeps boot going.
  }

  themeStore.init();
});

onErrorCaptured((error) => {
  handleError(error, "app:error-captured");
  appError.value = "De applicatie kon dit onderdeel niet tonen.";
  return false;
});

const reloadApp = (): void => {
  window.location.reload();
};
</script>

<style>
@import "./styles/main.css";

#app {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
  height: 100svh;
  height: 100dvh;
  min-height: 100lvh;
  overflow: hidden;
  background-color: var(--md-sys-color-background);
  color: var(--md-sys-color-on-background);
}

.app-content {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  position: relative;
  contain: layout style paint;
}

body {
  overflow: hidden;
}

/* Skip-link — visually hidden until focused (WCAG 2.4.1) */
.skip-link {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: calc(var(--z-toast) + 100);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border-radius: var(--md-sys-shape-corner-small);
  text-decoration: none;
  font: var(--md-sys-typescale-label-large);
  transform: translateY(-200%);
  transition: transform var(--motion-duration-short) var(--motion-easing-standard);
}
.skip-link:focus-visible,
.skip-link:focus {
  transform: translateY(0);
}

#main-content:focus {
  outline: none;
}

.app-error {
  width: min(100% - var(--spacing-lg), 42rem);
  margin: var(--spacing-xl) auto;
  padding: var(--spacing-lg);
  border: 1px solid var(--md-sys-color-error);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}
</style>
