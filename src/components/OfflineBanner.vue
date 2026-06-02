<template>
  <Transition name="offline-fade">
    <div v-if="isOffline" class="offline-banner" role="status" aria-live="polite">
      <Chip icon="wifi-off">Offline modus — vragen en resultaten werken nog</Chip>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import Chip from "./primitives/Chip.vue";

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
  z-index: calc(var(--z-toast) - 10);
  pointer-events: none;
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
