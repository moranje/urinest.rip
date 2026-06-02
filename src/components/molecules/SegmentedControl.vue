<template>
  <div
    class="segmented-control"
    :class="[`segmented-control--${size}`, { 'segmented-control--icon-only': iconOnly }]"
    role="radiogroup"
    :aria-label="label"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="segmented-control__option"
      :class="{ 'segmented-control__option--active': modelValue === option.value }"
      role="radio"
      :aria-checked="modelValue === option.value"
      :aria-label="option.ariaLabel ?? option.label"
      :title="option.title ?? option.ariaLabel ?? option.label"
      :disabled="option.disabled"
      @click="emit('update:modelValue', option.value)"
    >
      <Icon v-if="option.icon" :name="option.icon" :size="iconSize" />
      <span :class="{ 'segmented-control__text--hidden': iconOnly }">
        {{ option.label }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Icon from "../primitives/Icon.vue";

type IconName = InstanceType<typeof Icon>["$props"]["name"];
type Size = "sm" | "md";

interface SegmentedControlOption {
  readonly value: string;
  readonly label: string;
  readonly ariaLabel?: string;
  readonly title?: string;
  readonly icon?: IconName;
  readonly disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: readonly SegmentedControlOption[];
    label: string;
    size?: Size;
    iconOnly?: boolean;
  }>(),
  {
    size: "md",
    iconOnly: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const iconSize = computed(() => (props.size === "sm" ? 18 : 20));
</script>

<style scoped>
.segmented-control {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-surface-container-low);
}

.segmented-control__option {
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  padding: 0 var(--spacing-md);
  color: var(--md-sys-color-on-surface-variant);
  background: transparent;
  cursor: pointer;
  font: var(--md-sys-typescale-label-large);
  white-space: nowrap;
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    color var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-press) var(--motion-easing-standard);
}

.segmented-control--sm .segmented-control__option {
  padding: 0 var(--spacing-sm);
  font: var(--md-sys-typescale-label-medium);
}

.segmented-control--icon-only .segmented-control__option {
  padding: 0;
}

.segmented-control__option:hover:not(:disabled):not(.segmented-control__option--active) {
  background: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 8%, transparent);
}

.segmented-control__option--active {
  color: var(--md-sys-color-on-primary);
  background: var(--md-sys-color-primary);
}

.segmented-control__option:disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  cursor: not-allowed;
}

.segmented-control__option:active:not(:disabled) {
  transform: scale(0.96);
}

.segmented-control__text--hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
