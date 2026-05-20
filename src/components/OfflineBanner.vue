<template>
  <Transition name="offline-fade">
    <div v-if="isOffline" class="offline-banner" role="status" aria-live="polite">
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M2.05 7.05a14.85 14.85 0 0 1 5.27-3.43L5.85 2.15A16.85 16.85 0 0 0 .64 5.63zm9.95 0a14.85 14.85 0 0 1 9.95 4l1.46-1.45A16.85 16.85 0 0 0 12 5q-.34 0-.66.02zM12 13a4 4 0 0 0-2.83 1.17l2.83 2.83l2.83-2.83A4 4 0 0 0 12 13m9.19-5.36l-1.45 1.45A11.85 11.85 0 0 1 21.95 11l-1.46 1.46A9.85 9.85 0 0 0 12 9l9.19-1.36zM3 21l18-18l-1.41-1.42L1.59 19.58zM7.76 16.95a4.85 4.85 0 0 1 3.07-1.4l2.34 2.34l-2.83 2.83z"
        />
      </svg>
      <span>Offline modus — vragen en resultaten werken nog</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

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
