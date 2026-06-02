<template>
  <span
    class="badge"
    :class="[
      `badge--${variant}`,
      `badge--${size}`,
      { 'badge--pulse': pulse, 'motion-pulse-emphasis': pulse },
    ]"
    :role="role"
    :aria-label="ariaLabel"
    :title="title"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
type Variant =
  | "u1"
  | "u2"
  | "u3"
  | "error"
  | "warn"
  | "info"
  | "success"
  | "resolved"
  | "suppressed"
  | "dev"
  | "prod";

withDefaults(
  defineProps<{
    variant?: Variant;
    size?: "sm" | "md";
    role?: string;
    ariaLabel?: string;
    title?: string;
    pulse?: boolean;
  }>(),
  {
    variant: "info",
    size: "md",
    pulse: false,
    role: undefined,
    ariaLabel: undefined,
    title: undefined,
  },
);
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.badge--sm {
  padding: 2px var(--spacing-xs);
  border-radius: var(--md-sys-shape-corner-extra-small);
  font-size: 0.625rem;
  letter-spacing: 0.05em;
}

.badge--md {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--md-sys-shape-corner-full);
  font: var(--md-sys-typescale-label-large);
  font-weight: 700;
}

.badge--u1 {
  background-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
}
.badge--u2 {
  background-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
}

.badge--u3,
.badge--warn,
.badge--dev {
  background-color: var(--md-sys-color-warning-container);
  color: var(--md-sys-color-on-warning-container);
}

.badge--error {
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-error);
}

.badge--info,
.badge--success,
.badge--resolved,
.badge--prod {
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.badge--suppressed {
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-outline);
}
</style>
