<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    class="btn"
    :class="[
      `btn--${variant}`,
      `btn--${size}`,
      { 'btn--loading': loading, 'btn--full': fullWidth },
    ]"
  >
    <span v-if="loading" class="btn-spinner motion-spin" aria-hidden="true" />
    <slot name="leading" />
    <span class="btn-label"><slot /></span>
    <slot name="trailing" />
  </button>
</template>

<script setup lang="ts">
type Variant = "primary" | "outlined" | "text";
type Size = "sm" | "md" | "lg";

withDefaults(
  defineProps<{
    variant?: Variant;
    size?: Size;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
  }>(),
  {
    variant: "primary",
    size: "md",
    type: "button",
    disabled: false,
    loading: false,
    fullWidth: false,
  },
);
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  border: none;
  cursor: pointer;
  border-radius: var(--md-sys-shape-corner-full);
  font: var(--md-sys-typescale-label-large);
  text-decoration: none;
  position: relative;
  overflow: hidden;
  min-height: var(--min-touch-target);
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    box-shadow var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-press) var(--motion-easing-standard);
}

.btn--full {
  width: 100%;
}
.btn--sm {
  padding: 0 var(--spacing-md);
}
.btn--md {
  padding: 0 var(--spacing-lg);
}
.btn--lg {
  padding: 0 var(--spacing-xl);
  min-height: 48px;
}

.btn--primary {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}
.btn--primary:hover:not(:disabled) {
  box-shadow: var(--md-sys-elevation-1);
}
.btn--primary:disabled {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  cursor: not-allowed;
}

.btn--outlined {
  background-color: transparent;
  color: var(--md-sys-color-primary);
  border: 1px solid var(--md-sys-color-outline);
}
.btn--outlined:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}
.btn--outlined:disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  border-color: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
  cursor: not-allowed;
}

.btn--text {
  background-color: transparent;
  color: var(--md-sys-color-primary);
}
.btn--text:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}

.btn:active:not(:disabled) {
  transform: scale(0.97);
}

.btn--loading .btn-label {
  opacity: 0.6;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
}
</style>
