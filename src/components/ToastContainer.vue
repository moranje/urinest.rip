<template>
  <div v-if="toasts.length > 0" class="toast-container">
    <TransitionGroup name="toast-fly">
      <ToastMessage
        v-for="toast in toasts"
        :key="toast.id"
        :level="toast.level"
        :message="toast.message"
        :dismissible="toast.dismissible"
        @dismiss="dismiss(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useToastStore } from "../store/toastStore";
import ToastMessage from "./molecules/Toast.vue";

const toastStore = useToastStore();
const toasts = computed(() => toastStore.toasts);

function dismiss(id: number): void {
  toastStore.dismissToast(id);
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
