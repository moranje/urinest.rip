<template>
  <span
    class="badge"
    :class="[`badge--${variant}`, { 'badge--pulse': pulse, 'motion-pulse-emphasis': pulse }]"
    :role="role"
    :aria-label="ariaLabel"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
type Variant = "u1" | "u2" | "u3" | "info" | "success";

withDefaults(
  defineProps<{
    variant?: Variant;
    role?: string;
    ariaLabel?: string;
    pulse?: boolean;
  }>(),
  { variant: "info", pulse: false },
);
</script>

<style scoped>
.badge {
  display: inline-block;
  font: var(--md-sys-typescale-label-large);
  font-weight: 700;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--md-sys-shape-corner-full);
  color: white;
  letter-spacing: 0.02em;
}

.badge--u1 {
  background-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
}
.badge--u2 {
  background-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
}
.badge--u3 {
  background-color: var(--md-sys-color-warning);
  color: var(--md-sys-color-on-warning);
}
.badge--info {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}
.badge--success {
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}
</style>
