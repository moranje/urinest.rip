<template>
  <section class="notice" :class="`notice--${variant}`" :role="role" :aria-live="ariaLive">
    <div v-if="title" class="notice__header">
      <Icon :name="iconName" :size="20" />
      <h3 class="notice__title">{{ title }}</h3>
    </div>
    <div class="notice__body">
      <slot />
    </div>
    <div v-if="$slots.action" class="notice__action">
      <slot name="action" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Icon from "../primitives/Icon.vue";

defineOptions({
  name: "UiNotice",
});

type NoticeVariant = "info" | "warning" | "error" | "success";
type NoticeRole = "alert" | "status" | "note";

const props = withDefaults(
  defineProps<{
    variant?: NoticeVariant;
    title?: string;
    role?: NoticeRole;
  }>(),
  {
    variant: "info",
    title: "",
    role: "status",
  },
);

const iconName = computed(() => {
  if (props.variant === "warning" || props.variant === "error") return "warning";
  if (props.variant === "success") return "check-circle";
  return "info-circle";
});

const ariaLive = computed(() => {
  if (props.role === "alert") return "assertive";
  if (props.role === "status") return "polite";
  return undefined;
});
</script>

<style scoped>
.notice {
  display: grid;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--md-sys-shape-corner-medium);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-left-width: 3px;
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container-low);
}

.notice__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.notice__title {
  margin: 0;
  font: var(--md-sys-typescale-title-medium);
}

.notice__body {
  font: var(--md-sys-typescale-body-large);
  line-height: 1.6;
}

.notice__body :deep(p) {
  margin: 0;
}

.notice__action {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.notice--info {
  border-left-color: var(--md-sys-color-primary);
}

.notice--warning {
  border-left-color: var(--md-sys-color-warning);
  color: var(--md-sys-color-on-warning-container);
  background: var(--md-sys-color-warning-container);
}

.notice--error {
  border-left-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error-container);
  background: var(--md-sys-color-error-container);
}

.notice--success {
  border-left-color: var(--md-sys-color-primary);
  background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
}
</style>
