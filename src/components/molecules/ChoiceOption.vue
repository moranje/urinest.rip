<template>
  <div
    class="choice-option option-row"
    :class="{ 'choice-option--selected': selected, 'option-selected': selected }"
  >
    <button
      :ref="(el) => emit('optionRef', option.id, el)"
      class="choice-option__button option-item"
      :class="{ 'choice-option__button--selected': selected }"
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
      <span class="choice-option__content option-content">
        <span v-if="nonTouch" class="choice-option__prefix option-prefix" aria-hidden="true">
          {{ String.fromCharCode(65 + index) }}.
        </span>
        <span class="choice-option__text option-text">{{ option.text }}</span>
      </span>
    </button>
    <div v-if="option.description" class="choice-option__info option-info-wrapper">
      <button
        class="choice-option__info-button info-icon"
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
import Icon from "../primitives/Icon.vue";
import type { QuestionOption } from "../../types";

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
.choice-option {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  width: 100%;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: var(--md-sys-shape-corner-small);
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);
  transition:
    background-color var(--motion-duration-medium) var(--motion-easing-standard),
    border-color var(--motion-duration-medium) var(--motion-easing-standard),
    box-shadow var(--motion-duration-medium) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard);
}

.choice-option:hover {
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-primary) 4%,
    var(--md-sys-color-surface-container-lowest)
  );
}

.choice-option:focus-within {
  outline: none;
  box-shadow: inset 4px 0 0 var(--md-sys-color-primary);
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-primary) 6%,
    var(--md-sys-color-surface-container-lowest)
  );
}

.choice-option--selected {
  border-color: transparent;
  box-shadow: inset 3px 0 0 var(--md-sys-color-primary);
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-primary) 8%,
    var(--md-sys-color-surface-container-lowest)
  );
  color: var(--md-sys-color-primary);
}

.choice-option__button {
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  min-height: 56px;
  padding: var(--spacing-md);
  border: none;
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  text-align: left;
  touch-action: manipulation;
}

.choice-option__button:focus-visible {
  outline: none;
}

.choice-option__button::before {
  content: "";
  position: absolute;
  inset: 0;
  background-color: var(--md-sys-color-primary);
  opacity: 0;
  transition: opacity var(--motion-duration-medium) var(--motion-easing-standard);
  pointer-events: none;
}

.choice-option__button:active::before {
  opacity: var(--md-sys-state-pressed-state-layer-opacity);
  transition-duration: var(--motion-duration-press);
}

.choice-option--selected .choice-option__prefix {
  color: var(--md-sys-color-on-primary);
  background-color: var(--md-sys-color-primary);
}

.choice-option__content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
}

.choice-option__prefix {
  min-width: 1.75em;
  height: 1.75em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
  color: var(--md-sys-color-primary);
  font-size: 0.9em;
  font-weight: 500;
  line-height: 1;
}

.choice-option__text {
  flex-grow: 1;
  font: var(--md-sys-typescale-body-large);
  line-height: 1.4;
}

.choice-option__info {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding-inline: var(--spacing-sm);
}

.choice-option__info-button {
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  background: none;
  color: var(--md-sys-color-on-surface-variant);
  cursor: help;
  transition: background-color var(--motion-duration-medium) var(--motion-easing-standard);
}

.choice-option__info-button svg {
  width: 18px;
  height: 18px;
}

.choice-option__info:hover .choice-option__info-button {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 8%, transparent);
}

@media (max-width: 599.98px) {
  .choice-option__button {
    min-height: 56px;
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .choice-option__prefix {
    min-width: 1.6em;
    height: 1.6em;
    font-size: 0.85em;
  }
}
</style>
