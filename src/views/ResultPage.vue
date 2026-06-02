<template>
  <ResultTemplate
    :is-loading="isLoading"
    :error="error"
    :result="resultData"
    :documentation="planDocumentation"
    @back="goBack"
    @documentation-copied="handleDocumentationCopied"
    @documentation-error="handleDocumentationCopyError"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { handleError } from "../lib/errors";
import { readResultBackTarget } from "../lib/question-route";
import { useQuestionnaireStore } from "../store/questionnaireStore";
import { useToastStore } from "../store/toastStore";
import ResultTemplate from "../components/templates/ResultTemplate.vue";
import type { ResultData } from "../types";

const props = defineProps<{
  resultKey: string;
}>();

const router = useRouter();
const route = useRoute();
const toast = useToastStore();
const resultData = ref<ResultData | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const planDocumentation = computed(() => {
  if (!resultData.value) return "";
  return (resultData.value.documentation || "").trim();
});

const fetchResultData = (key: string): void => {
  isLoading.value = true;
  error.value = null;
  resultData.value = null;

  const store = useQuestionnaireStore();
  const foundResult = store.getResultByKey(key);

  if (foundResult) {
    resultData.value = foundResult;
  } else {
    const availableKeys = Object.keys(store.results);
    const questionnaires = store.questionnaireList.map((q) => q.id);
    handleError(new Error(`Result key not found: ${key}`), "result-page:key-not-found", {
      resultKey: key,
      availableKeys,
      questionnaires,
    });
    error.value = `Resultaat "${key}" niet gevonden. Doorzochte vragenlijsten: ${questionnaires.join(" → ")}`;
  }

  isLoading.value = false;
};

const goBack = (): void => {
  void router.push(readResultBackTarget(route.query)).catch((navigationError: unknown) => {
    handleError(navigationError, "result-page:back", { resultKey: props.resultKey });
  });
};

const handleDocumentationCopied = (): void => {
  navigator.vibrate?.(10);
  toast.success("Gekopieerd naar klembord");
};

const handleDocumentationCopyError = (copyError: unknown): void => {
  handleError(copyError, "result-page:copy-documentation", { resultKey: props.resultKey });
  toast.error("Kopiëren mislukt");
};

onMounted(async () => {
  const store = useQuestionnaireStore();
  if (!store.dataReady) {
    try {
      await store.loadInitialData();
    } catch (loadError) {
      handleError(loadError, "result-page:load-data", { resultKey: props.resultKey });
      error.value = "Kon vragenlijstgegevens niet laden";
      return;
    }
  }
  fetchResultData(props.resultKey);
});

watch(
  () => props.resultKey,
  async (newKey, oldKey) => {
    if (newKey !== oldKey) {
      const store = useQuestionnaireStore();
      if (!store.dataReady) {
        try {
          await store.loadInitialData();
        } catch (loadError) {
          handleError(loadError, "result-page:load-data", { resultKey: newKey });
          error.value = "Kon vragenlijstgegevens niet laden";
          return;
        }
      }
      fetchResultData(newKey);
    }
  },
);
</script>
