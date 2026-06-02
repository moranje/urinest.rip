<template>
  <span
    class="status-badge"
    :class="[`status-badge--${variant}`, `status-badge--${size}`, { 'status-badge--pulse': pulse }]"
    :role="role"
    :aria-label="ariaLabel"
    :title="title"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
type StatusBadgeVariant =
  | "u1"
  | "u2"
  | "u3"
  | "error"
  | "warn"
  | "info"
  | "resolved"
  | "suppressed"
  | "dev"
  | "prod";

withDefaults(
  defineProps<{
    variant?: StatusBadgeVariant;
    size?: "sm" | "md";
    pulse?: boolean;
    role?: string;
    ariaLabel?: string;
    title?: string;
  }>(),
  {
    variant: "info",
    size: "sm",
    pulse: false,
    role: undefined,
    ariaLabel: undefined,
    title: undefined,
  },
);
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: var(--md-sys-shape-corner-extra-small);
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.status-badge--sm {
  padding: 2px var(--spacing-xs);
  font-size: 0.625rem;
  letter-spacing: 0.05em;
}

.status-badge--md {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--md-sys-shape-corner-full);
  font: var(--md-sys-typescale-label-large);
}

.status-badge--u1,
.status-badge--u2 {
  color: var(--md-sys-color-on-error);
  background: var(--md-sys-color-error);
}

.status-badge--u3,
.status-badge--warn,
.status-badge--dev {
  color: var(--md-sys-color-on-warning-container);
  background: var(--md-sys-color-warning-container);
}

.status-badge--error {
  color: var(--md-sys-color-error);
  background: var(--md-sys-color-error-container);
}

.status-badge--info,
.status-badge--prod,
.status-badge--resolved {
  color: var(--md-sys-color-on-primary-container);
  background: var(--md-sys-color-primary-container);
}

.status-badge--suppressed {
  color: var(--md-sys-color-outline);
  background: var(--md-sys-color-surface-container);
}

.status-badge--pulse {
  animation: status-badge-pulse 1.5s ease-in-out infinite;
}

@keyframes status-badge-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--md-sys-color-error) 60%, transparent);
  }
  50% {
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--md-sys-color-error) 0%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .status-badge--pulse {
    animation: none;
  }
}
</style>
