<template>
  <div class="question-panel">
    <QuestionToolbar :has-history="hasHistory" @back="emit('back')" @restart="emit('restart')" />
    <ProgressBar
      :value="progressValue"
      :max="progressMax"
      :label="progressLabel"
      :text="progressText"
      show-text
    />
    <p class="sr-only" aria-live="polite">{{ progressLabel }}: {{ question.text }}</p>
    <div class="question-panel__header">
      <h1 :id="titleId" class="question-panel__title">
        {{ question.text }}
      </h1>
      <p v-if="stepDescription" :id="stepId" class="question-panel__step">
        {{ stepDescription }}
      </p>
    </div>

    <ChoiceGroup
      :options="question.options"
      :selected-option-ids="selectedOptionIds"
      :selected-count="selectedCount"
      :has-selected-options="hasSelectedOptions"
      :multi-select="multiSelect"
      :non-touch="nonTouch"
      :labelled-by="titleId"
      :described-by="stepDescription ? stepId : undefined"
      :active-popover-option-id="activePopoverOptionId"
      @choose="emit('choose', $event)"
      @show-popover="(option, event) => emit('showPopover', option, event)"
      @toggle-popover="(option, event) => emit('togglePopover', option, event)"
      @schedule-popover-close="emit('schedulePopoverClose')"
      @close-popover="emit('closePopover')"
      @confirm="emit('confirm')"
    />

    <!-- eslint-disable vue/no-v-html -- sanitized Markdown from compiled YAML -->
    <div
      v-if="question.description && descriptionHtml"
      class="question-panel__description"
      v-html="descriptionHtml"
    />
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ChoiceGroup from "../molecules/ChoiceGroup.vue";
import ProgressBar from "../primitives/ProgressBar.vue";
import QuestionToolbar from "./QuestionToolbar.vue";
import type { Question, QuestionOption } from "../../types";

const props = withDefaults(
  defineProps<{
    question: Question;
    stepDescription?: string;
    descriptionHtml?: string;
    hasHistory: boolean;
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
  }>(),
  {
    stepDescription: "",
    descriptionHtml: "",
    activePopoverOptionId: null,
  },
);

const emit = defineEmits<{
  back: [];
  restart: [];
  choose: [option: QuestionOption];
  showPopover: [option: QuestionOption, event: MouseEvent | FocusEvent];
  togglePopover: [option: QuestionOption, event: MouseEvent | FocusEvent];
  schedulePopoverClose: [];
  closePopover: [];
  confirm: [];
}>();

const titleId = computed(() => `q-title-${props.question.id}`);
const stepId = computed(() => `q-step-${props.question.id}`);
</script>

<style scoped>
.question-panel {
  width: 100%;
  max-width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  margin: var(--spacing-md);
  padding: var(--spacing-lg);
  border-radius: var(--md-sys-shape-corner-large);
  box-shadow: var(--md-sys-elevation-1);
}

.question-panel__header {
  margin-bottom: var(--spacing-xl);
}

.question-panel__title {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--md-sys-color-on-surface);
  font: var(--md-sys-typescale-headline-small);
  text-wrap: balance;
}

.question-panel__step {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-body-small);
}

.question-panel__description {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-body-medium);
}

@container questionnaire (max-width: 37.5rem) {
  .question-panel {
    margin: var(--spacing-sm) 0;
    padding: var(--spacing-md);
  }

  .question-panel__header {
    margin-bottom: var(--spacing-lg);
  }
}

@container questionnaire (min-width: 37.5rem) {
  .question-panel {
    max-width: calc(100% - 2 * var(--spacing-md));
    margin: var(--spacing-lg) auto;
    padding: var(--spacing-xl);
  }

  .question-panel__title {
    font: var(--md-sys-typescale-headline-medium);
  }
}

@container questionnaire (min-width: 56.25rem) {
  .question-panel {
    max-width: var(--layout-content-max-width);
    margin: var(--spacing-xl) auto;
  }
}
</style>
