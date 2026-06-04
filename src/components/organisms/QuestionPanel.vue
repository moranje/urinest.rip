<template>
  <Card class="question-panel" variant="elevated">
    <QuestionToolbar :can-restart="canRestart" @restart="emit('restart')" />
    <ProgressBar
      :value="progressValue"
      :max="progressMax"
      label="Indicatieve voortgang door vragenlijst"
    />
    <p class="sr-only" aria-live="polite">Nieuwe vraag: {{ question.text }}</p>
    <div class="question-panel__header">
      <h1 :id="titleId" ref="titleRef" class="question-panel__title" tabindex="-1">
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
      :submitting="submitting"
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
  </Card>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import ChoiceGroup from "../molecules/ChoiceGroup.vue";
import Card from "../primitives/Card.vue";
import ProgressBar from "../primitives/ProgressBar.vue";
import QuestionToolbar from "./QuestionToolbar.vue";
import type { Question, QuestionOption } from "../../types";

const props = withDefaults(
  defineProps<{
    question: Question;
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
    submitting?: boolean;
    activePopoverOptionId?: string | null;
  }>(),
  {
    stepDescription: "",
    descriptionHtml: "",
    submitting: false,
    activePopoverOptionId: null,
  },
);

const emit = defineEmits<{
  restart: [];
  choose: [option: QuestionOption];
  showPopover: [option: QuestionOption, event: MouseEvent | FocusEvent];
  togglePopover: [option: QuestionOption, event: MouseEvent | FocusEvent];
  schedulePopoverClose: [];
  closePopover: [];
  confirm: [];
}>();

const titleRef = ref<HTMLHeadingElement | null>(null);
const titleId = computed(() => `q-title-${props.question.id}`);
const stepId = computed(() => `q-step-${props.question.id}`);

function focusTitle(): void {
  titleRef.value?.focus({ preventScroll: true });
}

onMounted(() => {
  void nextTick(focusTitle);
});

watch(
  () => props.question.id,
  () => {
    void nextTick(focusTitle);
  },
);
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

.question-panel__title:focus {
  outline: none;
}

.question-panel__step {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-body-small);
}

.question-panel__description {
  margin-top: var(--spacing-lg);
  padding-top: 0;
  border: 0;
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-body-medium);
}

.question-panel__description :deep(a) {
  color: var(--md-sys-color-primary);
  text-decoration: underline;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.18em;
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
