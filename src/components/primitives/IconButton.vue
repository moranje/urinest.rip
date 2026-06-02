<template>
  <button
    :type="type"
    :disabled="disabled"
    :aria-label="buttonAriaLabel"
    class="icon-button"
    :class="[`icon-button--${variant}`, `icon-button--${size}`]"
  >
    <Icon :name="icon" :size="iconSize" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Icon from "./Icon.vue";

type IconName = InstanceType<typeof Icon>["$props"]["name"];
type Variant = "standard" | "filled" | "tonal" | "outlined";
type Size = "sm" | "md" | "lg";

const props = withDefaults(
  defineProps<{
    icon: IconName;
    ariaLabel?: string;
    // eslint-disable-next-line vue/prop-name-casing
    "aria-label"?: string;
    variant?: Variant;
    size?: Size;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
  }>(),
  {
    variant: "standard",
    size: "md",
    type: "button",
    disabled: false,
    ariaLabel: undefined,
    "aria-label": undefined,
  },
);

const iconSize = computed(() => (props.size === "sm" ? 18 : props.size === "lg" ? 24 : 20));
const buttonAriaLabel = computed(() => props.ariaLabel ?? props["aria-label"]);
</script>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--md-sys-shape-corner-full);
  border: 1px solid transparent;
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
  padding: 0;
  color: var(--md-sys-color-on-surface-variant);
  background: transparent;
  cursor: pointer;
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    border-color var(--motion-duration-short) var(--motion-easing-standard),
    color var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-press) var(--motion-easing-standard);
}

.icon-button--sm {
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
}

.icon-button--lg {
  min-width: 48px;
  min-height: 48px;
}

.icon-button--standard:hover:not(:disabled) {
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
}

.icon-button--filled {
  color: var(--md-sys-color-on-primary);
  background: var(--md-sys-color-primary);
}

.icon-button--tonal {
  color: var(--md-sys-color-on-secondary-container);
  background: var(--md-sys-color-secondary-container);
}

.icon-button--outlined {
  color: var(--md-sys-color-on-surface-variant);
  border-color: var(--md-sys-color-outline);
}

.icon-button:disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
  cursor: not-allowed;
}

.icon-button:active:not(:disabled) {
  transform: scale(0.96);
}
</style>
