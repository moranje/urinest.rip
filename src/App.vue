<template>
  <div id="app">
    <a href="#main-content" class="skip-link">Naar inhoud springen</a>
    <app-header :droplet-animate="dropletAnimate" />
    <main id="main-content" class="app-content" tabindex="-1">
      <router-view v-slot="{ Component, route: r }">
        <component :is="Component" :key="r.fullPath" />
      </router-view>
    </main>
    <OfflineBanner />
    <ToastContainer />
    <UpdatePrompt />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import ToastContainer from "./components/ToastContainer.vue";
import UpdatePrompt from "./components/UpdatePrompt.vue";
import OfflineBanner from "./components/OfflineBanner.vue";
import { useQuestionnaireStore } from "./store/questionnaireStore";
import { handleError } from "./lib/errors";

const route = useRoute();
const questionnaireStore = useQuestionnaireStore();

const dropletAnimate = ref(false);
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
  } catch (error) {
    handleError(error, "app:load-data");
  }

  const themeMql = window.matchMedia("(prefers-color-scheme: dark)");
  themeMql.addEventListener("change", (e) => {
    document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
  });
});
</script>

<style>
@import "./styles/main.css";

#app {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
  height: 100dvh;
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
</style>
