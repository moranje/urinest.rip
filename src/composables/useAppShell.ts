import { onErrorCaptured, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { handleError } from "../lib/errors";
import { useQuestionnaireStore } from "../store/questionnaireStore";
import { useThemeStore } from "../store/themeStore";

export function routeViewKey(viewRoute: { readonly fullPath: string; readonly name?: unknown }) {
  return viewRoute.name === "Questionnaire" ? "questionnaire" : viewRoute.fullPath;
}

export function useAppShell() {
  const route = useRoute();
  const questionnaireStore = useQuestionnaireStore();
  const themeStore = useThemeStore();

  const dropletAnimate = ref(false);
  const appError = ref<string | null>(null);

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
      // loadInitialData reports through telemetry; shell keeps boot going.
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

  return {
    appError,
    dropletAnimate,
    reloadApp,
    routeViewKey,
  };
}
