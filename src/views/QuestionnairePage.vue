<template>
  <QuestionnaireTemplate
    :is-loading="isLoading"
    :question="currentQuestion"
    :group-questions="isCurrentStepGrouped ? currentStepQuestions : []"
    :group-answers="groupAnswers"
    :group-title="currentStep?.title ?? currentQuestion?.text ?? ''"
    :is-grouped-step="isCurrentStepGrouped"
    :step-description="currentStep?.description"
    :description-html="compiledMarkdown(currentQuestion?.description)"
    :can-restart="hasHistory"
    :progress-value="progressValue"
    :progress-max="progressMax"
    :progress-label="progressLabel"
    :progress-text="progressText"
    :selected-option-ids="selectedOptionIds"
    :selected-count="selectedCount"
    :has-selected-options="hasSelectedOptions"
    :multi-select="isMultiSelect"
    :non-touch="isNonTouchDevice"
    :active-popover-option-id="activePopoverOptionId"
    :popover-html="compiledMarkdown(popoverDescription)"
    :popover-style="popoverStyle"
    @restart="restartQuestionnaire"
    @choose="isMultiSelect ? toggleOption($event) : selectOption($event)"
    @update-group-answer="updateGroupAnswer"
    @submit-group="submitGroupedStep"
    @show-popover="showPopover"
    @toggle-popover="togglePopover"
    @schedule-popover-close="schedulePopoverClose"
    @cancel-popover-close="cancelPopoverClose"
    @close-popover="closePopover"
    @confirm="confirmMultipleChoice"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router";
import { parseOutcome } from "@beslismodel/core";
import { useQuestionnaireRunner } from "@beslismodel/vue";
import QuestionnaireTemplate from "../components/templates/QuestionnaireTemplate.vue";
import { usePopover } from "../composables/usePopover";
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
import type { Answer, QuestionOption as QuestionOptionData, AnswerValue } from "../types";

const router = useRouter();
const route = useRoute();
const questionnaireStore = useQuestionnaireStore();
const roleStore = useRoleStore();
const log = createLogger("questionnaire-page");

const props = defineProps<{
  id: string;
}>();

const isLoading = ref(true);
const isNonTouchDevice = ref(false);
const isNavigating = ref(false);
const runner = useQuestionnaireRunner(questionnaireStore, { questionnaireId: () => props.id });
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
  popoverDescription,
  popoverStyle,
  showPopover,
  closePopover,
  cancelPopoverClose,
  schedulePopoverClose,
  togglePopover,
} = usePopover();

// --- Computed Properties ---

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
    questionnaireStore.getAnswer(props.id, question.id),
  ]);
  return Object.fromEntries(entries);
});

// --- Lifecycle Hooks ---

onMounted(async () => {
  if (!questionnaireStore.dataReady) {
    try {
      await questionnaireStore.loadInitialData();
    } catch (err) {
      log.warn("load failed", { error: err, questionnaireId: props.id });
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

// --- Core Logic ---

const loadStateAndDetermineStart = async (options: { reset?: boolean } = {}): Promise<void> => {
  isLoading.value = true;
  if (!questionnaire.value) {
    handleError(new Error(`Questionnaire not found: ${props.id}`), "questionnaire:not-found", {
      questionnaireId: props.id,
    });
    router.replace({ name: "Error", query: { message: "Vragenlijst niet gevonden" } });
    return;
  }

  const requestedQuestionId = readQuestionRouteQuery(route.query);

  // Only wipe answers on explicit reset (e.g. user pressed "Opnieuw beginnen"
  // or navigated to a different flow). Mounting/remounting on the same
  // flow-id preserves progress (DSN-C02).
  if (options.reset) {
    questionnaireStore.clearAnswers(props.id);
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
      flowId: props.id,
      version: questionnaire.value.version,
      role: roleStore.role,
      questionId: requestedQuestionId,
    });
    return;
  }

  if (requestedQuestionId) {
    log.warn("route question could not be restored", {
      questionId: requestedQuestionId,
      questionnaireId: props.id,
    });
  }

  isLoading.value = false;
  if (transition.type === "question") {
    recordFlowStart({
      flowId: props.id,
      version: questionnaire.value.version,
      role: roleStore.role,
      questionId: transition.questionId,
    });
    syncQuestionRoute(transition.questionId, "replace");
  } else if (transition.type === "complete") {
    nextTick(() => {
      void determineResult({ backTarget: "/" });
    });
  }
};

const restartQuestionnaire = (): void => {
  const hasStoredAnswers =
    Object.keys(questionnaireStore.getAllAnswersForQuestionnaire(props.id)).length > 0;
  if (
    (hasHistory.value || hasStoredAnswers) &&
    !window.confirm("Opnieuw beginnen met deze vragenlijst?")
  ) {
    return;
  }
  clearFlowTrail();
  clearStoredRedirectTrail();
  void loadStateAndDetermineStart({ reset: true });
};

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

type QuestionRouteMode = "push" | "replace";

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

  const location = createQuestionRouteLocation(props.id, questionId, route.query);
  void router[mode](location).catch((error: unknown) => {
    handleError(error, `router:question-${mode}`, {
      questionHistory: [...questionHistory.value],
      questionId,
      questionnaireId: props.id,
    });
  });
};

const advanceQuestionState = (branch?: string, mode: "question" | "step" = "question"): void => {
  const previousQuestionId = currentQuestionId.value;
  if (previousQuestionId) {
    recordFlowStep({
      flowId: props.id,
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
    return;
  }
  if (transition.type === "missing") {
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

const determineResult = async (options: { backTarget?: string } = {}): Promise<void> => {
  if (isNavigating.value) return;
  isNavigating.value = true;

  let answers: ReturnType<typeof questionnaireStore.getAllAnswersForQuestionnaire> | null = null;
  let outcome: string | null | undefined;
  try {
    const fullQuestionnaire = questionnaireStore.getFullQuestionnaire(props.id);
    if (!fullQuestionnaire) {
      throw new Error(`Questionnaire not found: ${props.id}`);
    }

    answers = questionnaireStore.getAllAnswersForQuestionnaire(props.id);
    const resolvedOutcome = await questionnaireStore.determineOutcomeForPathWithCalculators(
      props.id,
      answers,
      fullQuestionnaire.resultsLogic,
      fullQuestionnaire.calculations,
    );
    outcome = resolvedOutcome.outcome;

    const typedOutcome = parseOutcome(outcome);
    if (typedOutcome.type === "redirect") {
      const value = typedOutcome.target;
      const redirect = appendStoredRedirectTrail(props.id, value);
      if (redirect.type === "cycle") {
        handleError(
          new Error(`Redirect cycle detected: ${redirect.cycle.join(" -> ")}`),
          "decision-engine:redirect-cycle",
          {
            questionnaireId: props.id,
            targetQuestionnaireId: value,
            role: roleStore.role,
            redirectChain: redirect.cycle,
          },
        );
        clearStoredRedirectTrail();
        await pushNavigation("/error", "router:error-navigation", {
          questionnaireId: props.id,
          targetQuestionnaireId: value,
        });
        return;
      }
      recordFlowRedirect({
        flowId: props.id,
        version: fullQuestionnaire.version,
        targetFlowId: value,
        role: roleStore.role,
      });
      isLoading.value = true;
      questionnaireStore.clearAnswers(props.id);
      await pushNavigation(`/questionnaire/${value}`, "router:questionnaire-redirect", {
        questionnaireId: props.id,
        targetQuestionnaireId: value,
      });
      return;
    } else if (typedOutcome.type === "result") {
      const value = typedOutcome.key;
      recordFlowResult({
        flowId: props.id,
        version: fullQuestionnaire.version,
        resultId: value,
        role: roleStore.role,
      });
      clearStoredRedirectTrail();
      await pushNavigation(
        createResultRouteLocation(value, options.backTarget ?? route.fullPath),
        "router:result",
        {
          questionnaireId: props.id,
          resultId: value,
        },
      );
      return;
    } else {
      handleError(new Error("No outcome matched"), "decision-engine:no-outcome", {
        questionnaireId: props.id,
        role: roleStore.role,
        answeredQuestionIds: Object.keys(answers ?? {}),
      });
      clearStoredRedirectTrail();
      await pushNavigation("/error", "router:error-navigation", {
        questionnaireId: props.id,
      });
      return;
    }
  } catch (error) {
    handleError(error, "decision-engine:resolve-result", {
      questionnaireId: props.id,
      outcome,
      role: roleStore.role,
      answeredQuestionIds: Object.keys(answers ?? {}),
    });
    clearStoredRedirectTrail();
    await pushNavigation("/error", "router:error-navigation", {
      questionnaireId: props.id,
    });
  }
};

// --- Answer & Interaction Handlers ---

const selectOption = (option: QuestionOptionData): void => {
  if (!currentQuestion.value) return;
  breadcrumbClick("question-option-selected", {
    flowId: props.id,
    questionId: currentQuestion.value.id,
    optionId: option.id,
    role: roleStore.role,
  });
  questionnaireStore.setAnswer(props.id, currentQuestion.value.id, {
    value: option.value,
    text: option.text,
  });
  goToNextQuestion(option.id);
};

const toggleOption = (option: QuestionOptionData): void => {
  if (!currentQuestion.value) return;
  const currentAnswer = questionnaireStore.getAnswer(props.id, currentQuestion.value.id);
  const answerArray = (Array.isArray(currentAnswer) ? currentAnswer : []) as AnswerValue[];
  const newAnswer = [...answerArray];
  const existingIndex = newAnswer.findIndex((a) => a.value === option.value);

  if (existingIndex >= 0) {
    newAnswer.splice(existingIndex, 1);
  } else {
    newAnswer.push({ value: option.value, text: option.text });
  }
  breadcrumbClick("question-option-toggled", {
    flowId: props.id,
    questionId: currentQuestion.value.id,
    optionId: option.id,
    selected: existingIndex < 0,
    role: roleStore.role,
  });
  questionnaireStore.setAnswer(props.id, currentQuestion.value.id, newAnswer);
};

const confirmMultipleChoice = (): void => {
  if (currentQuestion.value) {
    const currentAnswer = questionnaireStore.getAnswer(props.id, currentQuestion.value.id);
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
      flowId: props.id,
      questionId: currentQuestion.value.id,
      selectedCount: selectedCount.value,
      role: roleStore.role,
    });
    goToNextQuestion(branch || undefined);
    return;
  }
  goToNextQuestion();
};

const updateGroupAnswer = (questionId: string, answer: AnswerValue): void => {
  setAnswerForQuestion(questionId, answer);
};

const submitGroupedStep = (): void => {
  breadcrumbClick("question-group-confirmed", {
    flowId: props.id,
    questionIds: currentStepQuestions.value.map((question) => question.id),
    role: roleStore.role,
  });
  advanceQuestionState("group", "step");
};

const isOptionSelected = (option: QuestionOptionData): boolean => {
  return runner.isOptionSelected(option);
};

// --- Utilities & UI ---

const handleKeyDown = (e: KeyboardEvent): void => {
  if (isLoading.value) return;

  if (e.key === "Escape") {
    if (activePopoverOptionId.value) {
      closePopover();
      e.preventDefault();
      return;
    }
  }

  if (isCurrentStepGrouped.value || !currentQuestion.value?.options) return;
  const key = e.key.toUpperCase();
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
    handleError(error, "markdown:compile", { questionnaireId: props.id });
    return "";
  }
};

const handleDocClick = (e: MouseEvent): void => {
  if (!activePopoverOptionId.value) return;
  const target = e.target as Node | null;
  if (!target) return;
  // If click is outside any info-icon or popover, close
  const popover = document.querySelector(".info-popover");
  const infoIcons = document.querySelectorAll(".info-icon");
  if (popover && popover.contains(target)) return;
  for (const icon of infoIcons) {
    if (icon.contains(target)) return;
  }
  closePopover();
};

// When questionnaire id changes (redirect between flows), reinitialize from scratch.
watch(
  () => props.id,
  async () => {
    isNavigating.value = false;
    resetNavigation();
    await loadStateAndDetermineStart({ reset: true });
  },
);

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
        questionnaireId: props.id,
      });
      syncQuestionRoute(currentQuestionId.value, "replace");
    }
  },
);

// Watch for the question becoming null (due to condition changes) and advance
watch(currentQuestion, (newQ, oldQ) => {
  if (newQ === null && oldQ !== null && !isLoading.value && !isNavigating.value) {
    nextTick(goToNextQuestion);
  }
});

// determineResult — when redirecting between flows, drop into fresh state
watch(
  () => isNavigating.value,
  () => {
    // no-op placeholder for future analytics
  },
);
</script>
