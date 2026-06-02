<template>
  <PageShell :droplet-animate="dropletAnimate" :app-error="appError" @reload="reloadApp">
    <router-view v-slot="{ Component, route: r }">
      <component :is="Component" :key="routeViewKey(r)" />
    </router-view>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onErrorCaptured } from "vue";
import { useRoute } from "vue-router";
import PageShell from "./components/templates/PageShell.vue";
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
</style>
