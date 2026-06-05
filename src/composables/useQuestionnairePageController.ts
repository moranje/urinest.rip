import { computed, nextTick, onBeforeUnmount, onMounted, ref, toValue, watch } from "vue";
import type { MaybeRefOrGetter } from "vue";
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router";
import { parseOutcome } from "@moranje/beslismodel/core";
import { useQuestionnaireRunner } from "@moranje/beslismodel/vue";
import { usePopover } from "./usePopover";
import { renderAppMarkdown } from "../lib/app-compatibility";
import { breadcrumbClick } from "../lib/breadcrumbs";
import { handleError } from "../lib/errors";
import {
  clearFlowTrail,
  recordFlowRedirect,
  recordFlowResult,
  recordFlowStart,
  recordFlowStep,
} from "../lib/flow-trail";
import { createLogger } from "../lib/logger";
import {
  buildQuestionRouteHistory,
  createQuestionRouteLocation,
  createResultRouteLocation,
  readQuestionRouteQuery,
} from "../lib/question-route";
import { appendStoredRedirectTrail, clearStoredRedirectTrail } from "../lib/redirect-trail";
import { useQuestionnaireStore } from "../store/questionnaireStore";
import { useRoleStore } from "../store/roleStore";
import type { Answer, AnswerValue, QuestionOption as QuestionOptionData } from "../types";

type QuestionRouteMode = "push" | "replace";

export function useQuestionnairePageController(questionnaireId: MaybeRefOrGetter<string>) {
  const id = computed(() => toValue(questionnaireId));
  const router = useRouter();
  const route = useRoute();
  const questionnaireStore = useQuestionnaireStore();
  const roleStore = useRoleStore();
  const log = createLogger("questionnaire-page");

  const isLoading = ref(true);
  const isNonTouchDevice = ref(false);
  const isNavigating = ref(false);
  const isSubmitting = ref(false);
  const runner = useQuestionnaireRunner(questionnaireStore, { questionnaireId: () => id.value });
  const {
    currentQuestionId,
    currentQuestion,
    currentStep,
    currentStepQuestions,
    hasHistory,
    hasSelectedOptions,
    isMultiSelect,
    isCurrentStepGrouped,
    findNextQuestionId,
    progress,
    questionnaire,
    questionHistory,
    replaceHistory,
    resetNavigation,
    selectedCount,
    setAnswerForQuestion,
    setCurrentQuestion,
    start: startQuestionnaire,
    advance: advanceQuestion,
    advanceCurrentStep,
  } = runner;

  const {
    activePopoverOptionId,
    popoverShouldFocus,
    popoverDescription,
    popoverStyle,
    showPopover,
    closePopover,
    cancelPopoverClose,
    schedulePopoverClose,
    togglePopover,
  } = usePopover();

  const progressValue = computed((): number => progress.value.value);
  const progressMax = computed((): number => progress.value.max);
  const progressLabel = computed((): string => progress.value.label);
  const progressText = computed((): string => progress.value.text);

  const selectedOptionIds = computed(
    () =>
      currentQuestion.value?.options
        .filter((option) => isOptionSelected(option))
        .map((option) => option.id) ?? [],
  );

  const groupAnswers = computed<Record<string, Answer | undefined>>(() => {
    const entries = currentStepQuestions.value.map((question) => [
      question.id,
      questionnaireStore.getAnswer(id.value, question.id),
    ]);
    return Object.fromEntries(entries);
  });

  const getQuestionStepId = (questionId: string | null): string | undefined => {
    if (!questionId || !questionnaire.value) return undefined;
    return questionnaire.value.stepIds.find((sid: string) => {
      const step = questionnaireStore.getStepById(sid);
      return step?.questionIds.includes(questionId);
    });
  };

  const restoreQuestionRouteState = (questionId: string): boolean => {
    if (!questionnaire.value) return false;
    const history = buildQuestionRouteHistory({
      findNextQuestionId,
      questionIds: questionnaire.value.questionIds,
      targetQuestionId: questionId,
    });
    if (!history) return false;

    replaceHistory(history);
    setCurrentQuestion(questionId);
    closePopover();
    return true;
  };

  const pushNavigation = async (
    target: RouteLocationRaw,
    module: string,
    context: Record<string, unknown>,
  ): Promise<boolean> => {
    try {
      await router.push(target);
      return true;
    } catch (error) {
      isNavigating.value = false;
      handleError(error, module, context);
      return false;
    }
  };

  const syncQuestionRoute = (questionId: string | null, mode: QuestionRouteMode): void => {
    if (!questionId) return;
    if (readQuestionRouteQuery(route.query) === questionId) return;

    const location = createQuestionRouteLocation(id.value, questionId, route.query);
    void router[mode](location).catch((error: unknown) => {
      handleError(error, `router:question-${mode}`, {
        questionHistory: [...questionHistory.value],
        questionId,
        questionnaireId: id.value,
      });
    });
  };

  const determineResult = async (): Promise<void> => {
    if (isNavigating.value) return;
    isNavigating.value = true;

    let answers: ReturnType<typeof questionnaireStore.getAllAnswersForQuestionnaire> | null = null;
    let outcome: string | null | undefined;
    try {
      const fullQuestionnaire = questionnaireStore.getFullQuestionnaire(id.value);
      if (!fullQuestionnaire) {
        throw new Error(`Questionnaire not found: ${id.value}`);
      }

      answers = questionnaireStore.getAllAnswersForQuestionnaire(id.value);
      const resolvedOutcome = await questionnaireStore.determineOutcomeForPathWithCalculators(
        id.value,
        answers,
        fullQuestionnaire.resultsLogic,
        fullQuestionnaire.calculations,
      );
      outcome = resolvedOutcome.outcome;

      const typedOutcome = parseOutcome(outcome);
      if (typedOutcome.type === "redirect") {
        const value = typedOutcome.target;
        const redirect = appendStoredRedirectTrail(id.value, value);
        if (redirect.type === "cycle") {
          handleError(
            new Error(`Redirect cycle detected: ${redirect.cycle.join(" -> ")}`),
            "decision-engine:redirect-cycle",
            {
              questionnaireId: id.value,
              targetQuestionnaireId: value,
              role: roleStore.role,
              redirectChain: redirect.cycle,
            },
          );
          clearStoredRedirectTrail();
          await pushNavigation("/error", "router:error-navigation", {
            questionnaireId: id.value,
            targetQuestionnaireId: value,
          });
          return;
        }
        recordFlowRedirect({
          flowId: id.value,
          version: fullQuestionnaire.version,
          targetFlowId: value,
          role: roleStore.role,
        });
        isLoading.value = true;
        await pushNavigation(`/questionnaire/${value}`, "router:questionnaire-redirect", {
          questionnaireId: id.value,
          targetQuestionnaireId: value,
        });
        return;
      }

      if (typedOutcome.type === "result") {
        const value = typedOutcome.key;
        recordFlowResult({
          flowId: id.value,
          version: fullQuestionnaire.version,
          resultId: value,
          role: roleStore.role,
        });
        clearStoredRedirectTrail();
        await pushNavigation(createResultRouteLocation(value), "router:result", {
          questionnaireId: id.value,
          resultId: value,
        });
        return;
      }

      handleError(new Error("No outcome matched"), "decision-engine:no-outcome", {
        questionnaireId: id.value,
        role: roleStore.role,
        answeredQuestionIds: Object.keys(answers ?? {}),
      });
      clearStoredRedirectTrail();
      await pushNavigation("/error", "router:error-navigation", {
        questionnaireId: id.value,
      });
    } catch (error) {
      handleError(error, "decision-engine:resolve-result", {
        questionnaireId: id.value,
        outcome,
        role: roleStore.role,
        answeredQuestionIds: Object.keys(answers ?? {}),
      });
      clearStoredRedirectTrail();
      await pushNavigation("/error", "router:error-navigation", {
        questionnaireId: id.value,
      });
    }
  };

  const loadStateAndDetermineStart = async (options: { reset?: boolean } = {}): Promise<void> => {
    isLoading.value = true;
    if (!questionnaire.value) {
      handleError(new Error(`Questionnaire not found: ${id.value}`), "questionnaire:not-found", {
        questionnaireId: id.value,
      });
      router.replace({ name: "Error", query: { message: "Vragenlijst niet gevonden" } });
      return;
    }

    const requestedQuestionId = readQuestionRouteQuery(route.query);

    if (options.reset) {
      questionnaireStore.clearAnswers(id.value);
    }

    const transition = startQuestionnaire({
      replayAnswers: !options.reset,
      resetHistory: true,
    });

    if (transition.type === "missing") {
      handleError(
        new Error(`Questionnaire not found: ${transition.questionnaireId}`),
        "questionnaire:not-found",
        {
          questionnaireId: transition.questionnaireId,
        },
      );
      router.replace({ name: "Error", query: { message: "Vragenlijst niet gevonden" } });
      return;
    }

    if (requestedQuestionId && restoreQuestionRouteState(requestedQuestionId)) {
      isLoading.value = false;
      recordFlowStart({
        flowId: id.value,
        version: questionnaire.value.version,
        role: roleStore.role,
        questionId: requestedQuestionId,
      });
      return;
    }

    if (requestedQuestionId) {
      log.warn("route question could not be restored", {
        questionId: requestedQuestionId,
        questionnaireId: id.value,
      });
    }

    isLoading.value = false;
    if (transition.type === "question") {
      recordFlowStart({
        flowId: id.value,
        version: questionnaire.value.version,
        role: roleStore.role,
        questionId: transition.questionId,
      });
      syncQuestionRoute(transition.questionId, "replace");
    } else if (transition.type === "complete") {
      nextTick(() => {
        void determineResult();
      });
    }
  };

  const advanceQuestionState = (branch?: string, mode: "question" | "step" = "question"): void => {
    closePopover();
    const previousQuestionId = currentQuestionId.value;
    if (previousQuestionId) {
      recordFlowStep({
        flowId: id.value,
        version: questionnaire.value?.version ?? "unknown",
        stepId: getQuestionStepId(previousQuestionId),
        questionId: previousQuestionId,
        branch,
        role: roleStore.role,
      });
    }
    const transition = mode === "step" ? advanceCurrentStep(branch) : advanceQuestion(branch);
    if (transition.type === "complete") {
      void determineResult();
      return;
    }
    if (transition.type === "question") {
      syncQuestionRoute(transition.questionId, "push");
      void nextTick(() => {
        isSubmitting.value = false;
      });
      return;
    }
    if (transition.type === "missing") {
      isSubmitting.value = false;
      handleError(
        new Error(`Questionnaire not found: ${transition.questionnaireId}`),
        "questionnaire:not-found",
        {
          questionnaireId: transition.questionnaireId,
        },
      );
      router.replace({ name: "Error", query: { message: "Vragenlijst niet gevonden" } });
    }
  };

  const goToNextQuestion = (branch?: string): void => {
    advanceQuestionState(branch);
  };

  const restartQuestionnaire = (): void => {
    const hasStoredAnswers =
      Object.keys(questionnaireStore.getAllAnswersForQuestionnaire(id.value)).length > 0;
    if (
      (hasHistory.value || hasStoredAnswers) &&
      !window.confirm("Opnieuw beginnen met deze vragenlijst?")
    ) {
      return;
    }
    isSubmitting.value = false;
    clearFlowTrail();
    clearStoredRedirectTrail();
    void loadStateAndDetermineStart({ reset: true });
  };

  const selectOption = (option: QuestionOptionData): void => {
    if (!currentQuestion.value) return;
    breadcrumbClick("question-option-selected", {
      flowId: id.value,
      questionId: currentQuestion.value.id,
      optionId: option.id,
      role: roleStore.role,
    });
    questionnaireStore.setAnswer(id.value, currentQuestion.value.id, {
      value: option.value,
      text: option.text,
    });
    goToNextQuestion(option.id);
  };

  const toggleOption = (option: QuestionOptionData): void => {
    if (!currentQuestion.value) return;
    const currentAnswer = questionnaireStore.getAnswer(id.value, currentQuestion.value.id);
    const answerArray = (Array.isArray(currentAnswer) ? currentAnswer : []) as AnswerValue[];
    const newAnswer = [...answerArray];
    const existingIndex = newAnswer.findIndex((answer) => answer.value === option.value);

    if (existingIndex >= 0) {
      newAnswer.splice(existingIndex, 1);
    } else {
      newAnswer.push({ value: option.value, text: option.text });
    }
    breadcrumbClick("question-option-toggled", {
      flowId: id.value,
      questionId: currentQuestion.value.id,
      optionId: option.id,
      selected: existingIndex < 0,
      role: roleStore.role,
    });
    questionnaireStore.setAnswer(id.value, currentQuestion.value.id, newAnswer);
  };

  const confirmMultipleChoice = (): void => {
    if (isSubmitting.value) return;
    if (currentQuestion.value) {
      isSubmitting.value = true;
      const currentAnswer = questionnaireStore.getAnswer(id.value, currentQuestion.value.id);
      const selectedValues = new Set(
        (Array.isArray(currentAnswer) ? currentAnswer : [])
          .filter((answer) => answer && typeof answer.value === "string")
          .map((answer) => answer.value),
      );
      const branch = currentQuestion.value.options
        .filter((option) => selectedValues.has(option.value))
        .map((option) => option.id)
        .sort()
        .join("+");
      breadcrumbClick("question-multiselect-confirmed", {
        flowId: id.value,
        questionId: currentQuestion.value.id,
        selectedCount: selectedCount.value,
        role: roleStore.role,
      });
      goToNextQuestion(branch || undefined);
      return;
    }
    isSubmitting.value = true;
    goToNextQuestion();
  };

  const updateGroupAnswer = (questionId: string, answer: AnswerValue): void => {
    setAnswerForQuestion(questionId, answer);
  };

  const submitGroupedStep = (): void => {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    breadcrumbClick("question-group-confirmed", {
      flowId: id.value,
      questionIds: currentStepQuestions.value.map((question) => question.id),
      role: roleStore.role,
    });
    advanceQuestionState("group", "step");
  };

  const isOptionSelected = (option: QuestionOptionData): boolean => {
    return runner.isOptionSelected(option);
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (isLoading.value) return;

    if (event.key === "Escape" && activePopoverOptionId.value) {
      closePopover();
      event.preventDefault();
      return;
    }

    if (isCurrentStepGrouped.value || !currentQuestion.value?.options) return;
    const key = event.key.toUpperCase();
    if (key.length === 1 && key >= "A" && key <= "Z") {
      const index = key.charCodeAt(0) - 65;
      if (index < currentQuestion.value.options.length) {
        const option = currentQuestion.value.options[index];
        if (isMultiSelect.value) {
          toggleOption(option);
        } else {
          selectOption(option);
        }
      }
    }
  };

  const checkNonTouch = (): void => {
    isNonTouchDevice.value =
      window.matchMedia("(pointer: fine)").matches || navigator.maxTouchPoints === 0;
  };

  const compiledMarkdown = (text: string | undefined): string => {
    try {
      return renderAppMarkdown(text);
    } catch (error) {
      handleError(error, "markdown:compile", { questionnaireId: id.value });
      return "";
    }
  };

  const handleDocClick = (event: MouseEvent): void => {
    if (!activePopoverOptionId.value) return;
    const target = event.target as Node | null;
    if (!target) return;
    const popover = document.querySelector(".info-popover");
    const infoIcons = document.querySelectorAll(".info-icon");
    if (popover && popover.contains(target)) return;
    for (const icon of infoIcons) {
      if (icon.contains(target)) return;
    }
    closePopover();
  };

  onMounted(async () => {
    if (!questionnaireStore.dataReady) {
      try {
        await questionnaireStore.loadInitialData();
      } catch (error) {
        log.warn("load failed", { error, questionnaireId: id.value });
        isLoading.value = false;
        router.replace({
          name: "Error",
          query: { message: "Kon gegevens niet laden", retry: route.fullPath },
        });
        return;
      }
    }
    await loadStateAndDetermineStart();
    checkNonTouch();
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleDocClick, true);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("click", handleDocClick, true);
  });

  watch(id, async () => {
    isNavigating.value = false;
    isSubmitting.value = false;
    resetNavigation();
    await loadStateAndDetermineStart();
  });

  watch(
    () => route.query.q,
    (value) => {
      if (isLoading.value || isNavigating.value) return;
      const questionId = typeof value === "string" && value.length > 0 ? value : null;

      if (!questionId) {
        syncQuestionRoute(currentQuestionId.value, "replace");
        return;
      }

      if (questionId === currentQuestionId.value) return;
      if (!restoreQuestionRouteState(questionId)) {
        log.warn("route question could not be restored", {
          questionId,
          questionnaireId: id.value,
        });
        syncQuestionRoute(currentQuestionId.value, "replace");
      }
    },
  );

  watch(currentQuestion, (newQuestion, oldQuestion) => {
    if (newQuestion === null && oldQuestion !== null && !isLoading.value && !isNavigating.value) {
      nextTick(goToNextQuestion);
    }
  });

  return {
    activePopoverOptionId,
    cancelPopoverClose,
    closePopover,
    compiledMarkdown,
    confirmMultipleChoice,
    currentQuestion,
    currentStep,
    currentStepQuestions,
    groupAnswers,
    hasHistory,
    hasSelectedOptions,
    isCurrentStepGrouped,
    isLoading,
    isMultiSelect,
    isNonTouchDevice,
    isSubmitting,
    popoverDescription,
    popoverShouldFocus,
    popoverStyle,
    progressLabel,
    progressMax,
    progressText,
    progressValue,
    restartQuestionnaire,
    schedulePopoverClose,
    selectOption,
    selectedCount,
    selectedOptionIds,
    showPopover,
    submitGroupedStep,
    toggleOption,
    togglePopover,
    updateGroupAnswer,
  };
}
