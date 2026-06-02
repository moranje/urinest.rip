<template>
  <Badge
    class="status-badge"
    :variant="variant"
    :size="size"
    :pulse="pulse"
    :role="role"
    :aria-label="ariaLabel"
    :title="title"
  >
    <slot />
  </Badge>
</template>

<script setup lang="ts">
import Badge from "../primitives/Badge.vue";

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
