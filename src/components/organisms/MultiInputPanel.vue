<template>
  <Card class="multi-input-panel" variant="elevated">
    <QuestionToolbar :can-restart="canRestart" @restart="emit('restart')" />
    <ProgressBar
      :value="progressValue"
      :max="progressMax"
      label="Indicatieve voortgang door vragenlijst"
    />

    <form class="multi-input-panel__form" @submit.prevent="submit">
      <div class="multi-input-panel__header">
        <h1 :id="titleId" ref="titleRef" class="multi-input-panel__title" tabindex="-1">
          {{ title }}
        </h1>
        <p v-if="stepDescription" class="multi-input-panel__step">
          {{ stepDescription }}
        </p>
      </div>

      <div class="multi-input-panel__grid" role="group" :aria-labelledby="titleId">
        <div
          v-for="question in questions"
          :key="question.id"
          class="multi-input-panel__field"
          :class="{ 'multi-input-panel__field--wide': isWide(question) }"
        >
          <Input
            v-if="question.type === 'number'"
            :id="`field-${question.id}`"
            :model-value="answerValue(question.id)"
            :label="question.text"
            :hint="question.description"
            :error="fieldError(question.id)"
            type="number"
            inputmode="decimal"
            enterkeyhint="next"
            required
            @update:model-value="updateTextAnswer(question, $event)"
          />

          <Select
            v-else
            :id="`field-${question.id}`"
            :model-value="answerValue(question.id)"
            :label="question.text"
            :hint="question.description"
            :error="fieldError(question.id)"
            :options="selectOptions(question)"
            placeholder="Kies..."
            required
            @update:model-value="updateOptionAnswer(question, $event)"
          />
        </div>
      </div>

      <div class="multi-input-panel__actions">
        <span class="multi-input-panel__status" aria-live="polite">
          {{ completedCount }}/{{ questions.length }} ingevuld
        </span>
        <Button type="submit" size="lg" :disabled="submitting || !canSubmit" :loading="submitting">
          Bereken resultaat
        </Button>
      </div>
    </form>
  </Card>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import Button from "../primitives/Button.vue";
import Card from "../primitives/Card.vue";
import Input from "../primitives/Input.vue";
import ProgressBar from "../primitives/ProgressBar.vue";
import Select from "../primitives/Select.vue";
import QuestionToolbar from "./QuestionToolbar.vue";
import type { Answer, AnswerValue, Question } from "../../types";

interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

const props = defineProps<{
  title: string;
  questions: readonly Question[];
  answers: Readonly<Record<string, Answer | undefined>>;
  stepDescription?: string;
  canRestart: boolean;
  progressValue: number;
  progressMax: number;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  restart: [];
  "update-answer": [questionId: string, answer: AnswerValue];
  submit: [];
}>();

const attempted = ref(false);
const titleRef = ref<HTMLHeadingElement | null>(null);
const titleId = computed(() => `multi-input-title-${props.questions[0]?.id ?? "step"}`);

const answerValue = (questionId: string): string => {
  const answer = props.answers[questionId];
  if (Array.isArray(answer)) return "";
  return answer?.value ?? "";
};

const hasAnswer = (questionId: string): boolean => answerValue(questionId).trim().length > 0;
const completedCount = computed(
  () => props.questions.filter((question) => hasAnswer(question.id)).length,
);
const canSubmit = computed(() => completedCount.value === props.questions.length);

const fieldError = (questionId: string): string =>
  attempted.value && !hasAnswer(questionId) ? "Vul deze waarde in." : "";

const booleanOptions: readonly SelectOption[] = [
  { value: "true", label: "Ja" },
  { value: "false", label: "Nee" },
];

const selectOptions = (question: Question): readonly SelectOption[] => {
  if (question.options.length === 0 && question.type === "boolean") return booleanOptions;
  return question.options.map((option) => ({
    value: String(option.value),
    label: option.text,
  }));
};

const updateTextAnswer = (question: Question, value: string): void => {
  emit("update-answer", question.id, { value, text: value });
};

const updateOptionAnswer = (question: Question, value: string): void => {
  const option = selectOptions(question).find((candidate) => candidate.value === value);
  emit("update-answer", question.id, {
    value,
    text: option?.label ?? value,
  });
};

const isWide = (question: Question): boolean =>
  question.text.length > 42 || (question.description?.length ?? 0) > 90;

const submit = (): void => {
  attempted.value = true;
  if (props.submitting) return;
  if (!canSubmit.value) return;
  emit("submit");
};

function focusTitle(): void {
  titleRef.value?.focus({ preventScroll: true });
}

onMounted(() => {
  void nextTick(focusTitle);
});

watch(
  () => props.questions.map((question) => question.id).join("|"),
  () => {
    attempted.value = false;
    void nextTick(focusTitle);
  },
);
</script>

<style scoped>
.multi-input-panel {
  width: 100%;
  max-width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  margin: var(--spacing-md);
  padding: var(--spacing-lg);
}

.multi-input-panel__form {
  display: grid;
  gap: var(--spacing-xl);
}

.multi-input-panel__header {
  display: grid;
  gap: var(--spacing-sm);
}

.multi-input-panel__title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
  font: var(--md-sys-typescale-headline-small);
  text-wrap: balance;
}

.multi-input-panel__title:focus {
  outline: none;
}

.multi-input-panel__step {
  margin: 0;
  max-width: 68ch;
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-body-small);
}

.multi-input-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-lg);
}

.multi-input-panel__field {
  min-width: 0;
}

.multi-input-panel__field--wide {
  grid-column: 1 / -1;
}

.multi-input-panel__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.multi-input-panel__status {
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-label-large);
  font-variant-numeric: tabular-nums;
}

@container questionnaire (max-width: 37.5rem) {
  .multi-input-panel {
    margin: var(--spacing-sm) 0;
    padding: var(--spacing-md);
  }

  .multi-input-panel__grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--spacing-md);
  }

  .multi-input-panel__actions {
    align-items: stretch;
    flex-direction: column;
  }
}

@container questionnaire (min-width: 37.5rem) {
  .multi-input-panel {
    max-width: calc(100% - 2 * var(--spacing-md));
    margin: var(--spacing-lg) auto;
    padding: var(--spacing-xl);
  }

  .multi-input-panel__title {
    font: var(--md-sys-typescale-headline-medium);
  }
}

@container questionnaire (min-width: 56.25rem) {
  .multi-input-panel {
    max-width: var(--layout-content-max-width);
    margin: var(--spacing-xl) auto;
  }
}
</style>
