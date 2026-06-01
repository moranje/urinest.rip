<template>
  <div class="option-row">
    <button
      :ref="(el) => emit('optionRef', option.id, el)"
      class="option-item"
      :class="{ 'option-selected': selected }"
      type="button"
      :role="multiSelect ? 'checkbox' : 'radio'"
      :aria-checked="selected"
      :tabindex="tabIndex"
      :aria-describedby="popoverOpen ? popoverId : undefined"
      @click="emit('choose', option)"
      @keydown.enter.prevent="emit('choose', option)"
      @keydown.space.prevent="emit('choose', option)"
      @keydown.up.prevent="!multiSelect && emit('focusSibling', index, -1)"
      @keydown.down.prevent="!multiSelect && emit('focusSibling', index, 1)"
      @keydown.left.prevent="!multiSelect && emit('focusSibling', index, -1)"
      @keydown.right.prevent="!multiSelect && emit('focusSibling', index, 1)"
    >
      <span class="option-content">
        <span v-if="nonTouch" class="option-prefix" aria-hidden="true">
          {{ String.fromCharCode(65 + index) }}.
        </span>
        <span class="option-text">{{ option.text }}</span>
      </span>
    </button>
    <div v-if="option.description" class="option-info-wrapper">
      <button
        class="info-icon"
        type="button"
        :aria-expanded="popoverOpen"
        :aria-controls="popoverId"
        :aria-describedby="popoverOpen ? popoverId : undefined"
        aria-label="Meer informatie"
        @click.stop="emit('togglePopover', option, $event)"
        @keydown.escape.stop="emit('closePopover')"
        @mouseenter.stop="emit('showPopover', option, $event)"
        @mouseleave.stop="emit('schedulePopoverClose')"
        @focus.stop="emit('showPopover', option, $event)"
        @blur.stop="emit('closePopover')"
      >
        <Icon name="info-circle" :size="18" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Icon from "./primitives/Icon.vue";
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

const popoverId = computed(() => `option-info-${props.option.id}`);

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

<style scoped>
.option-row {
  display: flex;
  align-items: stretch;
  gap: var(--spacing-sm);
  width: 100%;
}

.option-item {
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: var(--spacing-md);
  min-height: 56px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
  transition:
    background-color var(--motion-duration-medium) var(--motion-easing-standard),
    border-color var(--motion-duration-medium) var(--motion-easing-standard),
    box-shadow var(--motion-duration-medium) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard);
  position: relative;
  overflow: hidden;
  text-align: left;
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);
}

.option-item::before {
  content: "";
  position: absolute;
  inset: 0;
  background-color: var(--md-sys-color-primary);
  opacity: 0;
  transition: opacity var(--motion-duration-medium) var(--motion-easing-standard);
  pointer-events: none;
}

.option-item:hover {
  box-shadow: inset 3px 0 0 var(--md-sys-color-primary);
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-primary) 4%,
    var(--md-sys-color-surface-container-lowest)
  );
}

.option-item:active::before {
  opacity: var(--md-sys-state-pressed-state-layer-opacity);
  transition-duration: var(--motion-duration-press);
}

.option-selected {
  border-color: var(--md-sys-color-primary);
  box-shadow: inset 3px 0 0 var(--md-sys-color-primary);
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-primary) 8%,
    var(--md-sys-color-surface-container-lowest)
  );
  color: var(--md-sys-color-primary);
}

.option-selected .option-prefix {
  color: var(--md-sys-color-on-primary);
  background-color: var(--md-sys-color-primary);
}

.option-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
}

.option-prefix {
  font-weight: 500;
  color: var(--md-sys-color-primary);
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
  border-radius: 50%;
  min-width: 1.75em;
  height: 1.75em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9em;
  line-height: 1;
}

.option-text {
  font: var(--md-sys-typescale-body-large);
  line-height: 1.4;
  flex-grow: 1;
}

.option-info-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.info-icon {
  background: none;
  border: none;
  padding: 13px;
  margin: -13px;
  border-radius: 50%;
  cursor: help;
  color: var(--md-sys-color-on-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
  transition: background-color var(--motion-duration-medium) var(--motion-easing-standard);
}

.info-icon svg {
  width: 18px;
  height: 18px;
}

.option-info-wrapper:hover .info-icon {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 8%, transparent);
}
</style>
