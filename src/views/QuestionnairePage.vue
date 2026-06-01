<template>
  <div class="questionnaire-page">
    <section class="page-content" aria-label="Vragenlijst">
      <div
        v-if="isLoading"
        class="md-card question-card"
        aria-busy="true"
        aria-label="Vragenlijst laden"
      >
        <div class="question-header">
          <Skeleton variant="title" />
          <Skeleton variant="short" />
        </div>
        <div class="question-options">
          <Skeleton variant="option" />
          <Skeleton variant="option" />
          <Skeleton variant="option" />
        </div>
      </div>
      <Transition v-else name="question-fade" mode="out-in">
        <div v-if="currentQuestion" :key="currentQuestion.id" class="md-card question-card">
          <div class="question-toolbar">
            <button
              v-if="hasHistory"
              class="back-button"
              type="button"
              aria-label="Vorige vraag (Esc of Backspace)"
              @click="goToPreviousQuestion"
            >
              <Icon name="arrow-left" :size="20" />
              Terug
            </button>
            <span class="question-toolbar-spacer" />
            <button
              v-if="hasHistory"
              class="restart-button"
              type="button"
              aria-label="Opnieuw beginnen"
              @click="restartQuestionnaire"
            >
              <Icon name="restart" :size="18" />
            </button>
          </div>
          <ProgressBar
            :value="progressValue"
            :max="progressMax"
            :label="progressLabel"
            :text="progressText"
            show-text
          />
          <p class="sr-only" aria-live="polite">{{ progressLabel }}: {{ currentQuestion.text }}</p>
          <div class="question-header">
            <h1
              :id="`q-title-${currentQuestion.id}`"
              class="question-title"
              style="view-transition-name: question-title"
            >
              {{ currentQuestion.text }}
            </h1>
            <p
              v-if="currentStep?.description"
              :id="`q-step-${currentQuestion.id}`"
              class="question-step"
            >
              {{ currentStep.description }}
            </p>
          </div>

          <div
            class="question-options"
            :role="isMultiSelect ? 'group' : 'radiogroup'"
            :aria-labelledby="`q-title-${currentQuestion.id}`"
            :aria-describedby="
              currentStep?.description ? `q-step-${currentQuestion.id}` : undefined
            "
          >
            <QuestionOption
              v-for="(option, index) in currentQuestion.options"
              :key="option.id"
              :option="option"
              :index="index"
              :selected="isOptionSelected(option)"
              :multi-select="isMultiSelect"
              :non-touch="isNonTouchDevice"
              :tab-index="getOptionTabIndex(option, index)"
              :popover-open="activePopoverOptionId === option.id"
              @choose="isMultiSelect ? toggleOption(option) : selectOption(option)"
              @option-ref="setOptionRef"
              @focus-sibling="focusSiblingOption"
              @show-popover="showPopover"
              @toggle-popover="togglePopover"
              @schedule-popover-close="schedulePopoverClose"
              @close-popover="closePopover"
            />

            <p v-if="isMultiSelect" class="multi-counter" :aria-live="'polite'">
              <span v-if="selectedCount === 0">Geen geselecteerd</span>
              <span v-else>{{ selectedCount }} geselecteerd</span>
            </p>

            <Button
              v-if="isMultiSelect"
              class="confirm-button"
              :disabled="!hasSelectedOptions"
              full-width
              size="lg"
              @click="confirmMultipleChoice"
            >
              Bevestigen<span v-if="selectedCount > 0"> ({{ selectedCount }})</span>
            </Button>
          </div>

          <!-- eslint-disable vue/no-v-html -- sanitized Markdown from compiled YAML -->
          <div
            v-if="currentQuestion.description"
            class="question-description"
            v-html="compiledMarkdown(currentQuestion.description)"
          />
          <!-- eslint-enable vue/no-v-html -->
        </div>
        <div v-else-if="!isLoading && !currentQuestion">
          <div class="loading-message">
            <div class="loading-spinner" />
            Resultaat bepalen...
          </div>
        </div>
      </Transition>
    </section>

    <teleport to="body">
      <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
      <div
        v-if="activePopoverOptionId"
        class="info-popover md-card"
        :id="activePopoverOptionId ? `option-info-${activePopoverOptionId}` : undefined"
        :style="popoverStyle"
        role="dialog"
        aria-label="Meer informatie"
        tabindex="-1"
        @mouseenter="cancelPopoverClose"
        @mouseleave="schedulePopoverClose"
        @focusin="cancelPopoverClose"
        @focusout="schedulePopoverClose"
      >
        <!-- eslint-disable vue/no-v-html -- sanitized Markdown from compiled YAML -->
        <div v-html="compiledMarkdown(popoverDescription)" />
        <!-- eslint-enable vue/no-v-html -->
        <button
          class="info-popover-close"
          type="button"
          aria-label="Informatie sluiten"
          @click="closePopover"
        >
          <Icon name="x" :size="16" />
        </button>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useRoute, useRouter } from "vue-router";
import QuestionOption from "../components/QuestionOption.vue";
import Button from "../components/primitives/Button.vue";
import Icon from "../components/primitives/Icon.vue";
import ProgressBar from "../components/primitives/ProgressBar.vue";
import Skeleton from "../components/primitives/Skeleton.vue";
import { usePopover } from "../composables/usePopover";
import { useQuestionNavigation } from "../composables/useQuestionNavigation";
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
import { getQuestionProgress } from "../lib/question-progress";
import { readStorage, removeStorage, writeStorage } from "../lib/storage";
import { observeViewTransition } from "../lib/view-transition";
import { useQuestionnaireStore } from "../store/questionnaireStore";
import { useRoleStore } from "../store/roleStore";
import type { QuestionOption as QuestionOptionData, Question, Step, AnswerValue } from "../types";

const router = useRouter();
const route = useRoute();
const questionnaireStore = useQuestionnaireStore();
const roleStore = useRoleStore();
const log = createLogger("questionnaire-page");
const REDIRECT_CHAIN_STORAGE_KEY = "urinest-redirect-chain";
const REDIRECT_CHAIN_TTL_MS = 5 * 60 * 1000;

interface RedirectChain {
  flows: string[];
  updatedAt: number;
}

const props = defineProps<{
  id: string;
}>();

const isLoading = ref(true);
const isNonTouchDevice = ref(false);
const isNavigating = ref(false);
const {
  currentQuestionId,
  questionHistory,
  hasHistory,
  setCurrentQuestion,
  pushHistory,
  replaceHistory,
  resetNavigation,
  goBack: goBackQuestion,
} = useQuestionNavigation();

// Option refs (for keyboard focus navigation in single-select radiogroup)
const optionRefs = ref<Record<string, HTMLElement | null>>({});
const setOptionRef = (optionId: string, el: Element | unknown): void => {
  optionRefs.value[optionId] = (el as HTMLElement) ?? null;
};

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

const readRedirectChain = (flowId: string): string[] => {
  const raw = readStorage("session", REDIRECT_CHAIN_STORAGE_KEY);
  if (!raw) return [flowId];
  try {
    const parsed = JSON.parse(raw) as Partial<RedirectChain>;
    if (
      !Array.isArray(parsed.flows) ||
      typeof parsed.updatedAt !== "number" ||
      Date.now() - parsed.updatedAt > REDIRECT_CHAIN_TTL_MS
    ) {
      removeStorage("session", REDIRECT_CHAIN_STORAGE_KEY);
      return [flowId];
    }
    const currentIndex = parsed.flows.indexOf(flowId);
    return currentIndex >= 0 ? parsed.flows.slice(0, currentIndex + 1) : [flowId];
  } catch (error) {
    removeStorage("session", REDIRECT_CHAIN_STORAGE_KEY);
    handleError(error, "questionnaire:redirect-chain-read", { flowId });
    return [flowId];
  }
};

const writeRedirectChain = (flows: string[]): void => {
  writeStorage(
    "session",
    REDIRECT_CHAIN_STORAGE_KEY,
    JSON.stringify({ flows, updatedAt: Date.now() } satisfies RedirectChain),
  );
};

const clearRedirectChain = (): void => {
  removeStorage("session", REDIRECT_CHAIN_STORAGE_KEY);
};

// --- Computed Properties ---

const isMultiSelect = computed(() => {
  const t = currentQuestion.value?.type;
  return t === "multiple" || t === "multi_select";
});

const questionnaire = computed(() => questionnaireStore.getQuestionnaireById(props.id));

const currentQuestion = computed((): Question | null | undefined => {
  if (!currentQuestionId.value) return null;
  return questionnaireStore.getQuestionById(currentQuestionId.value) ?? null;
});

const currentStep = computed((): Step | null | undefined => {
  if (!currentQuestionId.value || !questionnaire.value) return null;
  const stepId = questionnaire.value.stepIds.find((sid: string) => {
    const step = questionnaireStore.getStepById(sid);
    return step?.questionIds.includes(currentQuestionId.value!);
  });
  return stepId ? (questionnaireStore.getStepById(stepId) ?? null) : null;
});

const hasSelectedOptions = computed(() => {
  if (!currentQuestion.value) return false;
  const answer = questionnaireStore.getAnswer(props.id, currentQuestion.value.id);
  if (answer === undefined || answer === null) return false;
  if (isMultiSelect.value) {
    return Array.isArray(answer) && answer.length > 0;
  }
  return true;
});

const selectedCount = computed((): number => {
  if (!currentQuestion.value || !isMultiSelect.value) return 0;
  const answer = questionnaireStore.getAnswer(props.id, currentQuestion.value.id);
  if (Array.isArray(answer)) return answer.length;
  return 0;
});

const progress = computed(() => {
  const qData = questionnaireStore.getFullQuestionnaire(props.id) ?? questionnaire.value;
  return getQuestionProgress({
    questionnaire: qData,
    currentQuestionId: currentQuestionId.value,
    questionHistory: questionHistory.value,
    answers: questionnaireStore.getEnhancedAnswers(props.id),
  });
});
const progressValue = computed((): number => progress.value.value);
const progressMax = computed((): number => progress.value.max);
const progressLabel = computed((): string => progress.value.label);
const progressText = computed((): string => progress.value.text);

const getOptionTabIndex = (option: QuestionOptionData, index: number): number => {
  if (isMultiSelect.value) return 0;
  // For radiogroup: only the selected option (or the first if none selected) is in the tab order
  if (isOptionSelected(option)) return 0;
  const anySelected = currentQuestion.value?.options?.some((o) => isOptionSelected(o));
  if (!anySelected && index === 0) return 0;
  return -1;
};

const focusSiblingOption = (currentIndex: number, delta: number): void => {
  if (!currentQuestion.value?.options?.length) return;
  const len = currentQuestion.value.options.length;
  const nextIndex = (currentIndex + delta + len) % len;
  const nextOption = currentQuestion.value.options[nextIndex];
  if (!nextOption) return;
  const el = optionRefs.value[nextOption.id];
  if (el && typeof el.focus === "function") el.focus();
};

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
    resetNavigation();
  }
  setCurrentQuestion(findNextQuestionId(null));

  // If there are existing answers, fast-forward to the first unanswered valid question
  if (!options.reset) {
    const answers = questionnaireStore.getAllAnswersForQuestionnaire(props.id);
    const answered = Object.keys(answers);
    if (answered.length > 0) {
      // walk through stepIds and rebuild history of answered question ids
      const newHistory: string[] = [];
      let next: string | null = currentQuestionId.value;
      while (next && answered.includes(next)) {
        newHistory.push(next);
        next = findNextQuestionId(next);
      }
      if (newHistory.length > 0) {
        replaceHistory(newHistory);
        setCurrentQuestion(next);
      }
    }
  }

  if (currentQuestionId.value) {
    recordFlowStart({
      flowId: props.id,
      version: questionnaire.value.version,
      role: roleStore.role,
      questionId: currentQuestionId.value,
    });
  }

  isLoading.value = false;
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
  clearRedirectChain();
  void loadStateAndDetermineStart({ reset: true });
};

const getQuestionStepId = (questionId: string | null): string | undefined => {
  if (!questionId || !questionnaire.value) return undefined;
  return questionnaire.value.stepIds.find((sid: string) => {
    const step = questionnaireStore.getStepById(sid);
    return step?.questionIds.includes(questionId);
  });
};

const findNextQuestionId = (startQuestionId: string | null = null): string | null => {
  const qData = questionnaire.value;
  if (!qData || !qData.stepIds) return null;

  let searching = !startQuestionId;

  for (const stepId of qData.stepIds) {
    const step = questionnaireStore.getStepById(stepId);
    if (!step || !step.questionIds) continue;

    for (const questionId of step.questionIds) {
      if (searching) {
        const questionDef = questionnaireStore.getQuestionById(questionId);
        if (questionDef) {
          const { isValid } = questionnaireStore.validateConditions(
            props.id,
            questionDef.conditions || [],
          );
          if (isValid) {
            return questionId;
          }
        }
      } else if (questionId === startQuestionId) {
        searching = true;
      }
    }
  }
  return null;
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
    pushHistory(previousQuestionId);
  }
  const nextId = findNextQuestionId(previousQuestionId);
  if (nextId) {
    setCurrentQuestion(nextId);
  } else {
    setCurrentQuestion(null);
    determineResult();
  }
};

const previousQuestionState = (): void => {
  if (!hasHistory.value) return;
  goBackQuestion();
};

// View Transitions API helper — feature-detect + reduced-motion fallback
type DocumentWithViewTransitions = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => { finished: Promise<void> };
};
const withViewTransition = (mutate: () => void): void => {
  const doc = document as DocumentWithViewTransitions;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (typeof doc.startViewTransition === "function" && !reduced) {
    const transition = doc.startViewTransition(() => {
      mutate();
    });
    observeViewTransition(transition, (error) =>
      handleError(error, "questionnaire:view-transition"),
    );
  } else {
    mutate();
  }
};

const goToNextQuestion = (branch?: string): void => {
  withViewTransition(() => advanceQuestionState(branch));
};

const goToPreviousQuestion = (): void => {
  withViewTransition(previousQuestionState);
};

const determineResult = (): void => {
  if (isNavigating.value) return;
  isNavigating.value = true;

  const fullQuestionnaire = questionnaireStore.getFullQuestionnaire(props.id);
  if (!fullQuestionnaire) {
    router.replace("/error");
    return;
  }

  const answers = questionnaireStore.getAllAnswersForQuestionnaire(props.id);
  const { outcome } = questionnaireStore.determineOutcomeForPath(
    props.id,
    answers,
    fullQuestionnaire.resultsLogic,
  );

  if (outcome) {
    const [type, value] = outcome.split(":");
    if (!type || !value) {
      handleError(new Error(`Malformed outcome: ${outcome}`), "decision-engine:malformed-outcome", {
        questionnaireId: props.id,
        role: roleStore.role,
        answeredQuestionIds: Object.keys(answers),
      });
      clearRedirectChain();
      router.push("/error");
      return;
    }
    if (type === "redirect") {
      const redirectChain = readRedirectChain(props.id);
      if (redirectChain.includes(value)) {
        handleError(
          new Error(`Redirect cycle detected: ${[...redirectChain, value].join(" -> ")}`),
          "decision-engine:redirect-cycle",
          {
            questionnaireId: props.id,
            targetQuestionnaireId: value,
            role: roleStore.role,
            redirectChain: [...redirectChain, value],
          },
        );
        clearRedirectChain();
        router.push("/error");
        return;
      }
      writeRedirectChain([...redirectChain, value]);
      recordFlowRedirect({
        flowId: props.id,
        version: fullQuestionnaire.version,
        targetFlowId: value,
        role: roleStore.role,
      });
      questionnaireStore.clearAnswers(props.id);
      router.replace(`/questionnaire/${value}`);
    } else if (type === "result") {
      recordFlowResult({
        flowId: props.id,
        version: fullQuestionnaire.version,
        resultId: value,
        role: roleStore.role,
      });
      clearRedirectChain();
      router.push(`/info/${value}`);
    } else {
      handleError(
        new Error(`Unsupported outcome type: ${type}`),
        "decision-engine:unknown-outcome",
        {
          questionnaireId: props.id,
          outcome,
          role: roleStore.role,
        },
      );
      clearRedirectChain();
      router.push("/error");
    }
  } else {
    handleError(new Error("No outcome matched"), "decision-engine:no-outcome", {
      questionnaireId: props.id,
      role: roleStore.role,
      answeredQuestionIds: Object.keys(answers),
    });
    clearRedirectChain();
    router.push("/error");
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
  if (!currentQuestion.value) return false;
  const answer = questionnaireStore.getAnswer(props.id, currentQuestion.value.id);
  if (answer === undefined) return false;
  if (Array.isArray(answer)) {
    return answer.some((a) => a.value === option.value);
  }
  return (answer as AnswerValue).value === option.value;
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
  if (!text) return "";
  try {
    return DOMPurify.sanitize(marked.parse(text) as string, { USE_PROFILES: { html: true } });
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

.question-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.question-toolbar-spacer {
  flex: 1;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  background: transparent;
  color: var(--md-sys-color-primary);
  font: var(--md-sys-typescale-label-large);
  cursor: pointer;
  border-radius: var(--md-sys-shape-corner-small);
  min-height: var(--min-touch-target);
  transition: background-color var(--motion-duration-medium) var(--motion-easing-standard);
}
.back-button:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}
.back-button:active {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
}

.restart-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
  border: none;
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  border-radius: var(--md-sys-shape-corner-full);
  transition: background-color var(--motion-duration-medium) var(--motion-easing-standard);
}
.restart-button:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 8%, transparent);
  color: var(--md-sys-color-on-surface);
}

.multi-counter {
  font: var(--md-sys-typescale-label-medium);
  color: var(--md-sys-color-on-surface-variant);
  margin: var(--spacing-sm) 0 0;
  text-align: right;
}

.question-header {
  margin-bottom: var(--spacing-xl);
}

.question-title {
  font: var(--md-sys-typescale-headline-small);
  color: var(--md-sys-color-on-surface);
  margin: 0 0 var(--spacing-sm) 0;
  text-wrap: balance;
}

/* View Transitions API — question title morphs across question changes.
   Animation is declared in main.css (must be on root, not scoped).
   Reduced-motion is respected by the wrapper in script (withViewTransition). */

.question-step {
  font: var(--md-sys-typescale-body-small);
  color: var(--md-sys-color-on-surface-variant);
  margin: 0;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex: 1;
}

.info-popover {
  width: max-content;
  max-width: 300px;
  padding: var(--spacing-md);
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-3);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity var(--motion-duration-medium) var(--motion-easing-standard);
  font: var(--md-sys-typescale-body-small);
  text-align: left;
  color: var(--md-sys-color-on-surface);
  background-color: var(--md-sys-color-surface);
  overflow-y: auto;
  max-height: 300px;
}

.info-popover-close {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.info-popover-close:hover {
  background: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 8%, transparent);
}

.question-description {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--md-sys-color-outline-variant);
  font: var(--md-sys-typescale-body-medium);
  color: var(--md-sys-color-on-surface-variant);
}

.confirm-button {
  margin-top: var(--spacing-lg);
  width: 100%;
  min-height: 56px;
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

@container questionnaire (max-width: 37.5rem) {
  .page-content {
    padding: var(--spacing-sm);
  }
  .question-card {
    padding: var(--spacing-md);
    margin: var(--spacing-sm) 0;
  }
  .question-header {
    margin-bottom: var(--spacing-lg);
  }
  .question-options {
    gap: var(--spacing-sm);
  }
  .option-item {
    padding: var(--spacing-sm) var(--spacing-md);
    min-height: 56px;
  }
  .option-prefix {
    min-width: 1.6em;
    height: 1.6em;
    font-size: 0.85em;
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
  .question-title {
    font: var(--md-sys-typescale-headline-medium);
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
