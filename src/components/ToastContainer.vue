<template>
  <div v-if="toasts.length > 0" class="toast-container">
    <TransitionGroup name="toast-fly">
      <Notice
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :variant="toastNoticeVariant(toast.level)"
        :role="toast.level === 'error' ? 'alert' : 'status'"
      >
        <div class="toast-content">
          <Icon class="toast-icon" :name="toastIcon(toast.level)" :size="16" />
          <span class="toast-message">{{ toast.message }}</span>
          <IconButton
            v-if="toast.dismissible"
            class="toast-close-action"
            data-testid="toast-close"
            icon="x"
            size="sm"
            aria-label="Sluiten"
            @click="dismiss(toast.id)"
          />
        </div>
      </Notice>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useToastStore } from "../store/toastStore";
import Notice from "./molecules/Notice.vue";
import Icon from "./primitives/Icon.vue";
import IconButton from "./primitives/IconButton.vue";
import type { ToastLevel } from "../types";

const toastStore = useToastStore();
const toasts = computed(() => toastStore.toasts);

function dismiss(id: number): void {
  toastStore.dismissToast(id);
}

function toastIcon(
  level: ToastLevel,
): "check-circle" | "warning-circle" | "warning-triangle" | "info-circle" {
  if (level === "success") return "check-circle";
  if (level === "error") return "warning-circle";
  if (level === "warning") return "warning-triangle";
  return "info-circle";
}

function toastNoticeVariant(level: ToastLevel): "success" | "error" | "warning" | "info" {
  return level === "warning" ? "warning" : level;
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: var(--spacing-lg);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-width: 420px;
  width: calc(100% - var(--spacing-lg) * 2);
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  box-shadow: var(--md-sys-elevation-3);
}

.toast :deep(.notice__body) {
  font: var(--md-sys-typescale-body-medium);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.toast-icon {
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
}

.toast-close-action {
  flex-shrink: 0;
  color: inherit;
}

/* Transitions */
.toast-fly-enter-active {
  transition:
    opacity var(--motion-duration-enter) var(--motion-easing-out),
    transform var(--motion-duration-enter) var(--motion-easing-out);
}
.toast-fly-leave-active {
  transition:
    opacity var(--motion-duration-exit) var(--motion-easing-standard),
    transform var(--motion-duration-exit) var(--motion-easing-standard);
}
.toast-fly-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.toast-fly-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@supports (padding: env(safe-area-inset-bottom)) {
  .toast-container {
    bottom: calc(var(--spacing-lg) + env(safe-area-inset-bottom));
  }
}
</style>
