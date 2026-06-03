import { computed, onMounted, ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import { handleError } from "../lib/errors";
import { useQuestionnaireStore } from "../store/questionnaireStore";
import type { ResultData } from "../types";

export function useResultPage(resultKey: MaybeRefOrGetter<string>) {
  const store = useQuestionnaireStore();
  const resultData = ref<ResultData | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const planDocumentation = computed(() => {
    if (!resultData.value) return "";
    return (resultData.value.documentation || "").trim();
  });

  const resolveResultData = (key: string): void => {
    const foundResult = store.getResultByKey(key);

    if (foundResult) {
      resultData.value = foundResult;
      return;
    }

    const availableKeys = Object.keys(store.results);
    const questionnaires = store.questionnaireList.map((questionnaire) => questionnaire.id);
    handleError(new Error(`Result key not found: ${key}`), "result-page:key-not-found", {
      resultKey: key,
      availableKeys,
      questionnaires,
    });
    error.value = `Resultaat "${key}" niet gevonden. Doorzochte vragenlijsten: ${questionnaires.join(" -> ")}`;
  };

  const loadResult = async (key = toValue(resultKey)): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    resultData.value = null;

    if (!store.dataReady) {
      try {
        await store.loadInitialData();
      } catch (loadError) {
        handleError(loadError, "result-page:load-data", { resultKey: key });
        error.value = "Kon vragenlijstgegevens niet laden";
        isLoading.value = false;
        return;
      }
    }

    resolveResultData(key);
    isLoading.value = false;
  };

  onMounted(() => {
    void loadResult();
  });

  watch(
    () => toValue(resultKey),
    async (newKey, oldKey) => {
      if (newKey !== oldKey) {
        await loadResult(newKey);
      }
    },
  );

  return {
    error,
    isLoading,
    loadResult,
    planDocumentation,
    resultData,
  };
}
