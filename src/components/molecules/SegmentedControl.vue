<template>
  <div
    ref="controlRef"
    class="segmented-control"
    :class="[
      `segmented-control--${size}`,
      {
        'segmented-control--icon-only': iconOnly,
        'segmented-control--wrap-labels': wrapLabels,
      },
    ]"
    :style="controlStyle"
    role="radiogroup"
    :aria-label="label"
  >
    <button
      v-for="(option, index) in options"
      :key="option.value"
      type="button"
      class="segmented-control__option"
      :class="{ 'segmented-control__option--active': modelValue === option.value }"
      role="radio"
      :aria-checked="modelValue === option.value"
      :aria-label="option.ariaLabel ?? option.label"
      :title="option.title ?? option.ariaLabel ?? option.label"
      :disabled="option.disabled"
      :tabindex="optionTabIndex(option, index)"
      @click="selectOption(option)"
      @keydown="handleKeyDown($event, index)"
    >
      <Icon v-if="option.icon" :name="option.icon" :size="iconSize" />
      <span
        class="segmented-control__text"
        :class="{ 'segmented-control__text--hidden': iconOnly }"
      >
        {{ option.label }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
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
    wrapLabels?: boolean;
  }>(),
  {
    size: "md",
    iconOnly: false,
    wrapLabels: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const iconSize = computed(() => (props.size === "sm" ? 18 : 20));
const controlRef = ref<HTMLElement | null>(null);

const selectedIndex = computed(() =>
  props.options.findIndex((option) => option.value === props.modelValue),
);
const indicatorIndex = computed(() => Math.max(selectedIndex.value, 0));
const enabledIndices = computed(() =>
  props.options.flatMap((option, index) => (option.disabled ? [] : [index])),
);
const tabIndex = computed(() => {
  if (selectedIndex.value >= 0 && !props.options[selectedIndex.value]?.disabled) {
    return selectedIndex.value;
  }
  return enabledIndices.value[0] ?? -1;
});
const controlStyle = computed(
  () =>
    ({
      "--segmented-control-count": String(Math.max(props.options.length, 1)),
      "--segmented-control-index": String(indicatorIndex.value),
    }) as Record<string, string>,
);

const optionTabIndex = (option: SegmentedControlOption, index: number): number => {
  if (option.disabled) return -1;
  return tabIndex.value === index ? 0 : -1;
};

const selectOption = (option: SegmentedControlOption): void => {
  if (option.disabled) return;
  emit("update:modelValue", option.value);
};

const focusOption = async (index: number): Promise<void> => {
  await nextTick();
  const button = controlRef.value?.querySelectorAll<HTMLButtonElement>(
    ".segmented-control__option",
  )[index];
  button?.focus();
};

const moveSelection = (index: number, offset: number): void => {
  const enabled = enabledIndices.value;
  if (!enabled.length) return;
  const current = enabled.includes(index) ? index : tabIndex.value;
  const currentPosition = Math.max(enabled.indexOf(current), 0);
  const nextIndex = enabled[(currentPosition + offset + enabled.length) % enabled.length];
  const option = props.options[nextIndex];
  if (!option) return;
  selectOption(option);
  void focusOption(nextIndex);
};

const jumpSelection = (index: number): void => {
  const option = props.options[index];
  if (!option || option.disabled) return;
  selectOption(option);
  void focusOption(index);
};

const handleKeyDown = (event: KeyboardEvent, index: number): void => {
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    moveSelection(index, 1);
    return;
  }
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    moveSelection(index, -1);
    return;
  }
  if (event.key === "Home") {
    event.preventDefault();
    jumpSelection(enabledIndices.value[0] ?? index);
    return;
  }
  if (event.key === "End") {
    event.preventDefault();
    const enabled = enabledIndices.value;
    jumpSelection(enabled[enabled.length - 1] ?? index);
  }
};
</script>

<style scoped>
.segmented-control {
  --segmented-control-count: 1;
  --segmented-control-index: 0;
  --segmented-control-segment-min: max(var(--min-touch-target), 4.75rem);

  position: relative;
  isolation: isolate;
  max-inline-size: min(100%, var(--segmented-control-max-inline-size, 32rem));
  display: inline-grid;
  grid-template-columns: repeat(
    var(--segmented-control-count),
    minmax(var(--segmented-control-segment-min), 1fr)
  );
  align-items: stretch;
  padding: var(--spacing-xs);
  overflow: hidden;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-surface-container-low);
}

.segmented-control::before {
  content: "";
  position: absolute;
  inset-block: var(--spacing-xs);
  inset-inline-start: var(--spacing-xs);
  z-index: 0;
  width: calc((100% - (2 * var(--spacing-xs))) / var(--segmented-control-count));
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-primary);
  transform: translateX(calc(var(--segmented-control-index) * 100%));
  transition:
    transform var(--motion-duration-enter) var(--motion-easing-spring),
    background var(--motion-duration-medium) var(--motion-easing-standard);
}

.segmented-control__option {
  position: relative;
  z-index: 1;
  min-inline-size: 0;
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  padding: var(--spacing-xs) var(--spacing-md);
  overflow: hidden;
  color: var(--md-sys-color-on-surface-variant);
  background: transparent;
  cursor: pointer;
  font: var(--md-sys-typescale-label-large);
  text-align: center;
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    color var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-press) var(--motion-easing-standard);
}

.segmented-control--sm .segmented-control__option {
  padding: var(--spacing-xs) var(--spacing-sm);
  font: var(--md-sys-typescale-label-medium);
}

.segmented-control--icon-only .segmented-control__option {
  padding: 0;
}

.segmented-control--icon-only {
  --segmented-control-segment-min: var(--min-touch-target);
}

.segmented-control__option:hover:not(:disabled):not(.segmented-control__option--active) {
  background: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 8%, transparent);
}

.segmented-control__option--active {
  color: var(--md-sys-color-on-primary);
}

.segmented-control__option:disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  cursor: not-allowed;
}

.segmented-control__option:active:not(:disabled) {
  transform: scale(0.96);
}

.segmented-control__option:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--md-sys-color-on-surface) 72%, transparent);
  outline-offset: -3px;
}

.segmented-control__option--active:focus-visible {
  outline-color: var(--md-sys-color-on-primary);
}

.segmented-control__text {
  min-inline-size: 0;
  max-inline-size: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.segmented-control--wrap-labels .segmented-control__text {
  display: -webkit-box;
  overflow-wrap: anywhere;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
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

@media (prefers-reduced-motion: reduce) {
  .segmented-control::before,
  .segmented-control__option,
  .segmented-control__text {
    animation: none;
    transition-duration: 1ms;
  }
}
</style>
