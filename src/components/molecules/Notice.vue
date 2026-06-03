<template>
  <section class="notice" :class="`notice--${variant}`" :role="role" :aria-live="ariaLive">
    <div v-if="title" class="notice__header">
      <Icon :name="iconName" :size="20" />
      <component :is="titleTag" class="notice__title">{{ title }}</component>
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
type NoticeTitleTag = "h1" | "h2" | "h3";

const props = withDefaults(
  defineProps<{
    variant?: NoticeVariant;
    title?: string;
    titleTag?: NoticeTitleTag;
    role?: NoticeRole;
  }>(),
  {
    variant: "info",
    title: "",
    titleTag: "h3",
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
  --notice-accent: var(--md-sys-color-primary);
  --notice-accent-width: 4px;
  --notice-bg: var(--md-sys-color-surface-container-low);
  --notice-fg: var(--md-sys-color-on-surface);
  --notice-padding-block: clamp(24px, 4vw, 36px);
  --notice-padding-inline: clamp(32px, 5vw, 48px);

  display: grid;
  gap: var(--spacing-md);
  padding-block: var(--notice-padding-block);
  padding-inline: var(--notice-padding-inline);
  border-radius: var(--md-sys-shape-corner-medium);
  border: 0;
  color: var(--notice-fg);
  background: var(--notice-bg);
  box-shadow: inset var(--notice-accent-width) 0 0 var(--notice-accent);
  overflow: hidden;
}

.notice__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--notice-accent);
}

.notice__title {
  margin: 0;
  font: var(--md-sys-typescale-title-medium);
}

.notice__body {
  color: var(--notice-fg);
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
  --notice-accent: var(--md-sys-color-primary);
  --notice-bg: color-mix(
    in srgb,
    var(--md-sys-color-primary-container) 18%,
    var(--md-sys-color-surface-container-low)
  );
}

.notice--warning {
  --notice-accent: var(--md-sys-color-warning);
  --notice-bg: color-mix(
    in srgb,
    var(--md-sys-color-warning-container) 22%,
    var(--md-sys-color-surface-container-low)
  );
  --notice-fg: var(--md-sys-color-on-surface);
}

.notice--error {
  --notice-accent: var(--md-sys-color-error);
  --notice-bg: color-mix(
    in srgb,
    var(--md-sys-color-error-container) 24%,
    var(--md-sys-color-surface-container-low)
  );
  --notice-fg: var(--md-sys-color-on-surface);
}

.notice--success {
  --notice-accent: var(--md-sys-color-primary);
  --notice-bg: color-mix(
    in srgb,
    var(--md-sys-color-primary-container) 28%,
    var(--md-sys-color-surface-container-low)
  );
}

@media (max-width: 599.98px) {
  .notice {
    --notice-padding-block: var(--spacing-lg);
    --notice-padding-inline: clamp(24px, 7vw, 32px);
  }
}

@media (forced-colors: active) {
  .notice {
    border: 1px solid CanvasText;
    box-shadow: none;
  }
}
</style>
