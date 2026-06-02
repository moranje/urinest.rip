<template>
  <div class="questionnaire-page">
    <section class="page-content" aria-label="Vragenlijst">
      <div
        v-if="isLoading"
        class="md-card question-card"
        aria-busy="true"
        aria-label="Vragenlijst laden"
      >
        <div class="question-loading-header">
          <Skeleton variant="title" />
          <Skeleton variant="short" />
        </div>
        <div class="question-loading-options">
          <Skeleton variant="option" />
          <Skeleton variant="option" />
          <Skeleton variant="option" />
        </div>
      </div>
      <Transition v-else name="question-fade" mode="out-in">
        <QuestionPanel
          v-if="currentQuestion"
          :key="currentQuestion.id"
          :question="currentQuestion"
          :step-description="currentStep?.description"
          :description-html="compiledMarkdown(currentQuestion.description)"
          :has-history="hasHistory"
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
          @back="goToPreviousQuestion"
          @restart="restartQuestionnaire"
          @choose="isMultiSelect ? toggleOption($event) : selectOption($event)"
          @show-popover="showPopover"
          @toggle-popover="togglePopover"
          @schedule-popover-close="schedulePopoverClose"
          @close-popover="closePopover"
          @confirm="confirmMultipleChoice"
        />
        <div v-else-if="!isLoading && !currentQuestion">
          <div class="loading-message">
            <div class="loading-spinner" />
            Resultaat bepalen...
          </div>
        </div>
      </Transition>
    </section>

    <InfoPopover
      :active-option-id="activePopoverOptionId"
      :html="compiledMarkdown(popoverDescription)"
      :popover-style="popoverStyle"
      @cancel-close="cancelPopoverClose"
      @schedule-close="schedulePopoverClose"
      @close="closePopover"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { parseOutcome } from "@beslismodel/core";
import { useQuestionnaireRunner } from "@beslismodel/vue";
import InfoPopover from "../components/molecules/InfoPopover.vue";
import QuestionPanel from "../components/organisms/QuestionPanel.vue";
import Skeleton from "../components/primitives/Skeleton.vue";
import { usePopover } from "../composables/usePopover";
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
import { renderMarkdown } from "../lib/markdown-renderer";
import { appendStoredRedirectTrail, clearStoredRedirectTrail } from "../lib/redirect-trail";
import { useQuestionnaireStore } from "../store/questionnaireStore";
import { useRoleStore } from "../store/roleStore";
import type { QuestionOption as QuestionOptionData, AnswerValue } from "../types";

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
  goBack: goBackQuestion,
  hasHistory,
  hasSelectedOptions,
  isMultiSelect,
  progress,
  questionnaire,
  resetNavigation,
  selectedCount,
  start: startQuestionnaire,
  advance: advanceQuestion,
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

  if (transition.type === "question") {
    recordFlowStart({
      flowId: props.id,
      version: questionnaire.value.version,
      role: roleStore.role,
      questionId: transition.questionId,
    });
  }

  isLoading.value = false;
  if (transition.type === "complete") {
    nextTick(determineResult);
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

const advanceQuestionState = (branch?: string): void => {
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
  const transition = advanceQuestion(branch);
  if (transition.type === "complete") {
    determineResult();
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

const previousQuestionState = (): void => {
  if (!hasHistory.value) return;
  goBackQuestion();
};

const goToNextQuestion = (branch?: string): void => {
  advanceQuestionState(branch);
};

const goToPreviousQuestion = (): void => {
  previousQuestionState();
};

const determineResult = (): void => {
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
    const resolvedOutcome = questionnaireStore.determineOutcomeForPath(
      props.id,
      answers,
      fullQuestionnaire.resultsLogic,
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
        router.push("/error");
        return;
      }
      recordFlowRedirect({
        flowId: props.id,
        version: fullQuestionnaire.version,
        targetFlowId: value,
        role: roleStore.role,
      });
      questionnaireStore.clearAnswers(props.id);
      void router.replace(`/questionnaire/${value}`).catch((error: unknown) => {
        isNavigating.value = false;
        handleError(error, "router:questionnaire-redirect", {
          questionnaireId: props.id,
          targetQuestionnaireId: value,
        });
      });
    } else if (typedOutcome.type === "result") {
      const value = typedOutcome.key;
      recordFlowResult({
        flowId: props.id,
        version: fullQuestionnaire.version,
        resultId: value,
        role: roleStore.role,
      });
      clearStoredRedirectTrail();
      void router.push(`/info/${value}`).catch((error: unknown) => {
        isNavigating.value = false;
        handleError(error, "router:result", {
          questionnaireId: props.id,
          resultId: value,
        });
      });
    } else {
      handleError(new Error("No outcome matched"), "decision-engine:no-outcome", {
        questionnaireId: props.id,
        role: roleStore.role,
        answeredQuestionIds: Object.keys(answers ?? {}),
      });
      clearStoredRedirectTrail();
      void router.push("/error").catch((error: unknown) => {
        isNavigating.value = false;
        handleError(error, "router:error-navigation", { questionnaireId: props.id });
      });
    }
  } catch (error) {
    handleError(error, "decision-engine:resolve-result", {
      questionnaireId: props.id,
      outcome,
      role: roleStore.role,
      answeredQuestionIds: Object.keys(answers ?? {}),
    });
    clearStoredRedirectTrail();
    void router.push("/error").catch((navigationError: unknown) => {
      isNavigating.value = false;
      handleError(navigationError, "router:error-navigation", { questionnaireId: props.id });
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

const isOptionSelected = (option: QuestionOptionData): boolean => {
  return runner.isOptionSelected(option);
};

// --- Utilities & UI ---

const handleKeyDown = (e: KeyboardEvent): void => {
  if (isLoading.value) return;

  // Global Escape / Backspace → goToPreviousQuestion (if not focused on input)
  const target = e.target as HTMLElement | null;
  const isFormField = !!target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);

  if (e.key === "Escape") {
    if (activePopoverOptionId.value) {
      closePopover();
      e.preventDefault();
      return;
    }
    if (hasHistory.value) {
      goToPreviousQuestion();
      e.preventDefault();
      return;
    }
  }
  if (e.key === "Backspace" && !isFormField && hasHistory.value) {
    goToPreviousQuestion();
    e.preventDefault();
    return;
  }

  if (!currentQuestion.value?.options) return;
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
    return renderMarkdown(text);
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

<style scoped>
.questionnaire-page {
  display: flex;
  flex-direction: column;
  container-type: inline-size;
  container-name: questionnaire;
}

.page-content {
  flex: 1;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  max-width: var(--layout-content-max-width);
  margin: 0 auto;
  width: 100%;
}

.question-card {
  border-radius: var(--md-sys-shape-corner-large);
  padding: var(--spacing-lg);
  box-shadow: var(--md-sys-elevation-1);
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: var(--spacing-md);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* Animations */
.question-fade-enter-active {
  transition:
    opacity var(--motion-duration-enter) var(--motion-easing-out),
    transform var(--motion-duration-enter) var(--motion-easing-out);
}
.question-fade-leave-active {
  transition:
    opacity var(--motion-duration-exit) var(--motion-easing-standard),
    transform var(--motion-duration-exit) var(--motion-easing-standard);
}
.question-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.question-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Skeleton loading */
.skeleton-line {
  height: 14px;
  background: var(--md-sys-color-surface-container-high);
  border-radius: var(--md-sys-shape-corner-extra-small);
  animation: skeleton-shimmer var(--motion-duration-long) ease-in-out infinite alternate;
}
.skeleton-line--title {
  height: 24px;
  width: 70%;
  margin-bottom: var(--spacing-md);
}
.skeleton-line--short {
  width: 40%;
}
.skeleton-option {
  height: 56px;
  background: var(--md-sys-color-surface-container-high);
  border-radius: var(--md-sys-shape-corner-small);
  animation: skeleton-shimmer var(--motion-duration-long) ease-in-out infinite alternate;
}
.skeleton-option:nth-child(2) {
  animation-delay: 100ms;
}
.skeleton-option:nth-child(3) {
  animation-delay: 200ms;
}

.question-loading-header {
  margin-bottom: var(--spacing-xl);
}

.question-loading-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

@container questionnaire (max-width: 37.5rem) {
  .page-content {
    padding: var(--spacing-sm);
  }
  .question-card {
    padding: var(--spacing-md);
    margin: var(--spacing-sm) 0;
  }
  .question-loading-header {
    margin-bottom: var(--spacing-lg);
  }
}

@container questionnaire (min-width: 37.5rem) {
  .page-content {
    padding: var(--spacing-md) 0;
  }
  .question-card {
    padding: var(--spacing-xl);
    margin: var(--spacing-lg) auto;
  }
}

@container questionnaire (min-width: 56.25rem) {
  .page-content {
    padding: var(--spacing-md);
  }
  .question-card {
    max-width: var(--layout-content-max-width);
    margin: var(--spacing-xl) auto;
  }
}
</style>
