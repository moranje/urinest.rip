<template>
  <div class="questionnaire-template">
    <section class="questionnaire-template__content" aria-label="Vragenlijst">
      <Card
        v-if="isLoading"
        class="questionnaire-template__loading"
        variant="elevated"
        aria-busy="true"
        aria-label="Vragenlijst laden"
      >
        <div class="questionnaire-template__loading-header">
          <Skeleton variant="title" />
          <Skeleton variant="short" />
        </div>
        <div class="questionnaire-template__loading-options">
          <Skeleton variant="option" />
          <Skeleton variant="option" />
          <Skeleton variant="option" />
        </div>
      </Card>
      <Transition v-else name="question-fade" mode="out-in">
        <div v-if="question" :key="panelKey" class="questionnaire-template__panel">
          <MultiInputPanel
            v-if="isGroupedStep"
            :title="groupTitle || question.text"
            :questions="groupQuestions"
            :answers="groupAnswers"
            :step-description="stepDescription"
            :can-restart="canRestart"
            :progress-value="progressValue"
            :progress-max="progressMax"
            @restart="emit('restart')"
            @update-answer="(questionId, answer) => emit('updateGroupAnswer', questionId, answer)"
            @submit="emit('submitGroup')"
          />
          <QuestionPanel
            v-else
            :question="question"
            :step-description="stepDescription"
            :description-html="descriptionHtml"
            :can-restart="canRestart"
            :progress-value="progressValue"
            :progress-max="progressMax"
            :progress-label="progressLabel"
            :progress-text="progressText"
            :selected-option-ids="selectedOptionIds"
            :selected-count="selectedCount"
            :has-selected-options="hasSelectedOptions"
            :multi-select="multiSelect"
            :non-touch="nonTouch"
            :active-popover-option-id="activePopoverOptionId"
            @restart="emit('restart')"
            @choose="emit('choose', $event)"
            @show-popover="(option, event) => emit('showPopover', option, event)"
            @toggle-popover="(option, event) => emit('togglePopover', option, event)"
            @schedule-popover-close="emit('schedulePopoverClose')"
            @close-popover="emit('closePopover')"
            @confirm="emit('confirm')"
          />
        </div>
        <div v-else class="questionnaire-template__pending">
          <div class="questionnaire-template__spinner motion-spin" />
          Resultaat bepalen...
        </div>
      </Transition>
    </section>

    <InfoPopover
      :active-option-id="activePopoverOptionId"
      :html="popoverHtml"
      :popover-style="popoverStyle"
      @cancel-close="emit('cancelPopoverClose')"
      @schedule-close="emit('schedulePopoverClose')"
      @close="emit('closePopover')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import InfoPopover from "../molecules/InfoPopover.vue";
import MultiInputPanel from "../organisms/MultiInputPanel.vue";
import QuestionPanel from "../organisms/QuestionPanel.vue";
import Card from "../primitives/Card.vue";
import Skeleton from "../primitives/Skeleton.vue";
import type { Answer, AnswerValue, PopoverStyle, Question, QuestionOption } from "../../types";

const props = withDefaults(
  defineProps<{
    isLoading: boolean;
    question?: Question | null;
    groupQuestions?: readonly Question[];
    groupAnswers?: Readonly<Record<string, Answer | undefined>>;
    groupTitle?: string;
    isGroupedStep?: boolean;
    stepDescription?: string;
    descriptionHtml?: string;
    canRestart: boolean;
    progressValue: number;
    progressMax: number;
    progressLabel: string;
    progressText: string;
    selectedOptionIds: readonly string[];
    selectedCount: number;
    hasSelectedOptions: boolean;
    multiSelect: boolean;
    nonTouch: boolean;
    activePopoverOptionId?: string | null;
    popoverHtml?: string;
    popoverStyle?: PopoverStyle;
  }>(),
  {
    question: null,
    groupQuestions: () => [],
    groupAnswers: () => ({}),
    groupTitle: "",
    isGroupedStep: false,
    stepDescription: "",
    descriptionHtml: "",
    activePopoverOptionId: null,
    popoverHtml: "",
    popoverStyle: () => ({}),
  },
);

const panelKey = computed(() =>
  props.isGroupedStep
    ? `group-${props.groupQuestions.map((question) => question.id).join("-")}`
    : `question-${props.question?.id ?? "pending"}`,
);

const emit = defineEmits<{
  restart: [];
  choose: [option: QuestionOption];
  updateGroupAnswer: [questionId: string, answer: AnswerValue];
  submitGroup: [];
  showPopover: [option: QuestionOption, event: MouseEvent | FocusEvent];
  togglePopover: [option: QuestionOption, event: MouseEvent | FocusEvent];
  schedulePopoverClose: [];
  cancelPopoverClose: [];
  closePopover: [];
  confirm: [];
}>();
</script>

<style scoped>
.questionnaire-template {
  display: flex;
  flex-direction: column;
  container-type: inline-size;
  container-name: questionnaire;
}

.questionnaire-template__content {
  width: 100%;
  max-width: var(--layout-content-max-width);
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  margin: 0 auto;
}

.questionnaire-template__loading {
  width: 100%;
  max-width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: var(--spacing-lg);
  margin: var(--spacing-md);
}

.questionnaire-template__loading-header {
  margin-bottom: var(--spacing-xl);
}

.questionnaire-template__loading-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.questionnaire-template__pending {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-title-medium);
}

.questionnaire-template__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--md-sys-color-outline-variant);
  border-top-color: var(--md-sys-color-primary);
  border-radius: var(--md-sys-shape-corner-full);
}

.questionnaire-template__panel {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
}

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

@container questionnaire (max-width: 37.5rem) {
  .questionnaire-template__content {
    padding: var(--spacing-sm);
  }

  .questionnaire-template__loading {
    padding: var(--spacing-md);
    margin: var(--spacing-sm) 0;
  }

  .questionnaire-template__loading-header {
    margin-bottom: var(--spacing-lg);
  }
}

@container questionnaire (min-width: 37.5rem) {
  .questionnaire-template__content {
    padding: var(--spacing-md) 0;
  }

  .questionnaire-template__loading {
    max-width: calc(100% - 2 * var(--spacing-md));
    padding: var(--spacing-xl);
    margin: var(--spacing-lg) auto;
  }
}

@container questionnaire (min-width: 56.25rem) {
  .questionnaire-template__content {
    padding: var(--spacing-md);
  }

  .questionnaire-template__loading {
    max-width: var(--layout-content-max-width);
    margin: var(--spacing-xl) auto;
  }
}
</style>
