<template>
  <Transition name="offline-fade">
    <div v-if="isOffline" class="offline-banner" role="status" aria-live="polite">
      <Icon name="wifi-off" :size="16" />
      <span>Offline modus — vragen en resultaten werken nog</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import Icon from "./primitives/Icon.vue";

const isOffline = ref(false);

const update = (): void => {
  if (typeof navigator !== "undefined") {
    isOffline.value = navigator.onLine === false;
  }
};

const onOnline = (): void => {
  isOffline.value = false;
};
const onOffline = (): void => {
  isOffline.value = true;
};

onMounted(() => {
  update();
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
});

onBeforeUnmount(() => {
  window.removeEventListener("online", onOnline);
  window.removeEventListener("offline", onOffline);
});
</script>

<style scoped>
.offline-banner {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(var(--spacing-md) + var(--safe-bottom));
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-full);
  font: var(--md-sys-typescale-label-medium);
  box-shadow: var(--md-sys-elevation-2);
  z-index: calc(var(--z-toast) - 10);
  pointer-events: none;
}

.offline-banner svg {
  flex-shrink: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.offline-fade-enter-active,
.offline-fade-leave-active {
  transition:
    opacity var(--motion-duration-medium) var(--motion-easing-standard),
    transform var(--motion-duration-medium) var(--motion-easing-standard);
}

.offline-fade-enter-from,
.offline-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
