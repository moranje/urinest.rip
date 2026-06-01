<template>
  <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
  <div
    :ref="(el) => emit('optionRef', option.id, el)"
    class="option-item"
    :class="{ 'option-selected': selected }"
    :role="multiSelect ? 'checkbox' : 'radio'"
    :aria-checked="selected"
    :tabindex="tabIndex"
    @click="emit('choose', option)"
    @keydown.enter.prevent="emit('choose', option)"
    @keydown.space.prevent="emit('choose', option)"
    @keydown.up.prevent="!multiSelect && emit('focusSibling', index, -1)"
    @keydown.down.prevent="!multiSelect && emit('focusSibling', index, 1)"
    @keydown.left.prevent="!multiSelect && emit('focusSibling', index, -1)"
    @keydown.right.prevent="!multiSelect && emit('focusSibling', index, 1)"
  >
    <div class="option-content">
      <span v-if="nonTouch" class="option-prefix" aria-hidden="true">
        {{ String.fromCharCode(65 + index) }}.
      </span>
      <span class="option-text">{{ option.text }}</span>
    </div>
    <!-- The wrapper exists to stop the click bubbling into the option-item.
         `role="presentation"` declares it as purely structural so AT skips it. -->
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
    <div v-if="option.description" class="option-info-wrapper" role="presentation" @click.stop>
      <button
        class="info-icon"
        type="button"
        :aria-expanded="popoverOpen"
        aria-label="Meer informatie"
        @click.stop="emit('togglePopover', option, $event)"
        @keydown.escape.stop="emit('closePopover')"
        @mouseenter.stop="emit('showPopover', option, $event)"
        @mouseleave.stop="emit('schedulePopoverClose')"
        @focus.stop="emit('showPopover', option, $event)"
        @blur.stop="emit('schedulePopoverClose')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuestionOption } from "../types";

defineProps<{
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

<style scoped>
.option-item {
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: var(--spacing-md);
  min-height: 56px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
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
  margin-left: var(--spacing-sm);
  flex-shrink: 0;
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
