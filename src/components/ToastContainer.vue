<template>
  <div v-if="toasts.length > 0" class="toast-container" aria-live="polite">
    <TransitionGroup name="toast-fly">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="'toast--' + toast.level"
        role="alert"
      >
        <svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path v-if="toast.level === 'success'" d="M20 6L9 17l-5-5" />
          <path v-else-if="toast.level === 'error'" d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          <path v-else-if="toast.level === 'warning'" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <path v-else d="M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />
        </svg>
        <span class="toast-message">{{ toast.message }}</span>
        <button
          v-if="toast.dismissible"
          class="toast-close"
          @click="dismiss(toast.id)"
          aria-label="Sluiten"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToastStore } from '../store/toastStore'

const toastStore = useToastStore()
const toasts = computed(() => toastStore.toasts)

function dismiss(id: number): void {
  toastStore.dismissToast(id)
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
