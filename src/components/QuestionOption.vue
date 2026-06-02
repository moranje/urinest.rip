<template>
  <ChoiceOption
    v-bind="props"
    @choose="emit('choose', $event)"
    @option-ref="(optionId, el) => emit('optionRef', optionId, el)"
    @focus-sibling="(index, delta) => emit('focusSibling', index, delta)"
    @show-popover="(option, event) => emit('showPopover', option, event)"
    @toggle-popover="(option, event) => emit('togglePopover', option, event)"
    @schedule-popover-close="emit('schedulePopoverClose')"
    @close-popover="emit('closePopover')"
  />
</template>

<script setup lang="ts">
import ChoiceOption from "./molecules/ChoiceOption.vue";
import type { QuestionOption } from "../types";

const props = defineProps<{
  option: QuestionOption;
  index: number;
  selected: boolean;
  multiSelect: boolean;
  nonTouch: boolean;
  tabIndex: number;
  popoverOpen: boolean;
}>();

const emit = defineEmits<{
  choose: [option: QuestionOption];
  optionRef: [optionId: string, el: Element | unknown];
  focusSibling: [index: number, delta: number];
  showPopover: [option: QuestionOption, event: MouseEvent | FocusEvent];
  togglePopover: [option: QuestionOption, event: MouseEvent | FocusEvent];
  schedulePopoverClose: [];
  closePopover: [];
}>();
</script>
