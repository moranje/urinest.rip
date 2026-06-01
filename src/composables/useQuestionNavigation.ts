import { computed, ref } from "vue";

export function useQuestionNavigation() {
  const currentQuestionId = ref<string | null>(null);
  const questionHistory = ref<string[]>([]);
  const hasHistory = computed(() => questionHistory.value.length > 0);

  const setCurrentQuestion = (questionId: string | null): void => {
    currentQuestionId.value = questionId;
  };

  const pushHistory = (questionId: string | null): void => {
    if (questionId) questionHistory.value.push(questionId);
  };

  const replaceHistory = (history: string[]): void => {
    questionHistory.value = [...history];
  };

  const resetNavigation = (questionId: string | null = null): void => {
    currentQuestionId.value = questionId;
    questionHistory.value = [];
  };

  const goBack = (): string | null => {
    if (questionHistory.value.length === 0) return currentQuestionId.value;
    currentQuestionId.value = questionHistory.value.pop() ?? null;
    return currentQuestionId.value;
  };

  return {
    currentQuestionId,
    questionHistory,
    hasHistory,
    setCurrentQuestion,
    pushHistory,
    replaceHistory,
    resetNavigation,
    goBack,
  };
}
