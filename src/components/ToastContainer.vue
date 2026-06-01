<template>
  <div v-if="toasts.length > 0" class="toast-container">
    <TransitionGroup name="toast-fly">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="'toast--' + toast.level"
        :role="toast.level === 'error' ? 'alert' : 'status'"
      >
        <Icon class="toast-icon" :name="toastIcon(toast.level)" :size="16" />
        <span class="toast-message">{{ toast.message }}</span>
        <button
          v-if="toast.dismissible"
          class="toast-close"
          @click="dismiss(toast.id)"
          aria-label="Sluiten"
        >
          <Icon name="x" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useToastStore } from "../store/toastStore";
import Icon from "./primitives/Icon.vue";
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
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--md-sys-shape-corner-medium);
  font: var(--md-sys-typescale-body-medium);
  pointer-events: auto;
  box-shadow: var(--md-sys-elevation-3);
}

.toast--success {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  border: 1px solid var(--md-sys-color-primary);
}

.toast--error {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  border: 1px solid var(--md-sys-color-error);
}

.toast--warning {
  background: var(--md-sys-color-warning-container);
  color: var(--md-sys-color-on-warning-container);
  border: 1px solid var(--md-sys-color-warning);
}

.toast--info {
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
}

.toast-icon {
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  border-radius: var(--md-sys-shape-corner-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity var(--motion-duration-short) var(--motion-easing-standard);
}
.toast-close:hover {
  opacity: 1;
}

/* Transitions */
.toast-fly-enter-active {
  transition: all var(--motion-duration-enter) var(--motion-easing-out);
}
.toast-fly-leave-active {
  transition: all var(--motion-duration-exit) var(--motion-easing-standard);
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
