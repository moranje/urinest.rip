<template>
  <div
    class="choice-group question-options"
    :role="multiSelect ? 'group' : 'radiogroup'"
    :aria-labelledby="labelledBy"
    :aria-describedby="describedBy"
  >
    <ChoiceOption
      v-for="(option, index) in options"
      :key="option.id"
      :option="option"
      :index="index"
      :selected="selectedSet.has(option.id)"
      :multi-select="multiSelect"
      :non-touch="nonTouch"
      :tab-index="getOptionTabIndex(option, index)"
      :popover-open="activePopoverOptionId === option.id"
      @choose="emit('choose', option)"
      @option-ref="setOptionRef"
      @focus-sibling="focusSiblingOption"
      @show-popover="(currentOption, event) => emit('showPopover', currentOption, event)"
      @toggle-popover="(currentOption, event) => emit('togglePopover', currentOption, event)"
      @schedule-popover-close="emit('schedulePopoverClose')"
      @close-popover="emit('closePopover')"
    />

    <p v-if="multiSelect" class="choice-group__counter multi-counter" aria-live="polite">
      <span v-if="selectedCount === 0">Geen geselecteerd</span>
      <span v-else>{{ selectedCount }} geselecteerd</span>
    </p>

    <Button
      v-if="multiSelect"
      class="choice-group__confirm confirm-button"
      :disabled="submitting || !hasSelectedOptions"
      :loading="submitting"
      full-width
      size="lg"
      @click="emit('confirm')"
    >
      Bevestigen<span v-if="selectedCount > 0"> ({{ selectedCount }})</span>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "../primitives/Button.vue";
import ChoiceOption from "./ChoiceOption.vue";
import type { QuestionOption } from "../../types";

const props = withDefaults(
  defineProps<{
    options: readonly QuestionOption[];
    selectedOptionIds?: readonly string[];
    selectedCount?: number;
    hasSelectedOptions?: boolean;
    multiSelect: boolean;
    nonTouch: boolean;
    submitting?: boolean;
    labelledBy: string;
    describedBy?: string;
    activePopoverOptionId?: string | null;
  }>(),
  {
    selectedOptionIds: () => [],
    selectedCount: 0,
    hasSelectedOptions: false,
    submitting: false,
    describedBy: undefined,
    activePopoverOptionId: null,
  },
);

const emit = defineEmits<{
  choose: [option: QuestionOption];
  showPopover: [option: QuestionOption, event: MouseEvent | FocusEvent];
  togglePopover: [option: QuestionOption, event: MouseEvent | FocusEvent];
  schedulePopoverClose: [];
  closePopover: [];
  confirm: [];
}>();

const optionRefs = ref<Record<string, HTMLElement | null>>({});
const selectedSet = computed(() => new Set(props.selectedOptionIds));

function setOptionRef(optionId: string, el: Element | unknown): void {
  optionRefs.value[optionId] = (el as HTMLElement) ?? null;
}

function getOptionTabIndex(option: QuestionOption, index: number): number {
  if (props.multiSelect) return 0;
  if (selectedSet.value.has(option.id)) return 0;
  const anySelected = props.options.some((candidate) => selectedSet.value.has(candidate.id));
  if (!anySelected && index === 0) return 0;
  return -1;
}

function focusSiblingOption(currentIndex: number, delta: number): void {
  if (!props.options.length) return;
  const nextIndex = (currentIndex + delta + props.options.length) % props.options.length;
  const nextOption = props.options[nextIndex];
  if (!nextOption) return;
  optionRefs.value[nextOption.id]?.focus();
}
</script>

<style scoped>
.choice-group {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.choice-group__counter {
  margin: var(--spacing-sm) 0 0;
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-label-medium);
  text-align: right;
}

.choice-group__confirm {
  width: 100%;
  min-height: 56px;
  margin-top: var(--spacing-lg);
}

@media (max-width: 599.98px) {
  .choice-group {
    gap: var(--spacing-sm);
  }
}
</style>
