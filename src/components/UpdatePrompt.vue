<template>
  <Teleport to="body">
    <Transition name="scrim-fade">
      <div v-if="needRefresh" class="update-scrim" aria-hidden="true" />
    </Transition>
    <Transition name="sheet-fly">
      <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
      <div
        v-if="needRefresh"
        ref="sheetRef"
        class="update-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-title"
        aria-describedby="update-text"
        tabindex="-1"
        @keydown.esc.stop.prevent="handleDismiss"
      >
        <div class="drag-indicator" />
        <div class="update-icon">
          <Icon v-if="!updating" name="download" :size="28" />
          <Icon v-else name="spinner" :size="28" spin />
        </div>
        <h3 id="update-title" class="update-title">
          {{ updating ? "Bijwerken..." : "Update beschikbaar" }}
        </h3>
        <p id="update-text" class="update-text">
          {{ updating ? "Even geduld..." : "Er is een nieuwe versie beschikbaar." }}
        </p>
        <div class="update-actions">
          <Button :loading="updating" @click="handleUpdate">
            {{ updating ? "Bijwerken..." : "Nu bijwerken" }}
          </Button>
          <Button v-if="!updating" variant="text" @click="handleDismiss"> Later </Button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { useRegisterSW } from "virtual:pwa-register/vue";
import { handleError } from "../lib/errors";
import Button from "./primitives/Button.vue";
import Icon from "./primitives/Icon.vue";

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisterError(error) {
    handleError(error, "service-worker:register");
  },
  onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
    if (!registration) return;
    setInterval(async () => {
      if (registration.installing || !navigator.onLine) return;
      try {
        await registration.update();
      } catch (error) {
        handleError(error, "service-worker:update");
      }
    }, UPDATE_CHECK_INTERVAL);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && !registration.installing) {
        registration.update().catch((error: unknown) => {
          handleError(error, "service-worker:update-visible");
        });
      }
    });
  },
});

onMounted(() => {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready
    .then((reg) => {
      if (reg.waiting) needRefresh.value = true;
    })
    .catch((error: unknown) => {
      handleError(error, "service-worker:ready");
    });
});

const updating = ref(false);
const sheetRef = ref<HTMLElement | null>(null);

watch(needRefresh, async (visible) => {
  if (!visible) return;
  await nextTick();
  sheetRef.value?.focus();
});

function handleUpdate() {
  updating.value = true;
  updateServiceWorker(true);
}

function handleDismiss() {
  needRefresh.value = false;
}
</script>

<style scoped>
.update-scrim {
  position: fixed;
  inset: 0;
  background: var(--md-sys-color-scrim);
  z-index: var(--z-update-banner);
}

.update-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-update-banner);
  background: var(--md-sys-color-surface-container-low);
  border-radius: var(--md-sys-shape-corner-extra-large) var(--md-sys-shape-corner-extra-large) 0 0;
  padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-xl);
  box-shadow: var(--md-sys-elevation-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
}

.drag-indicator {
  width: 32px;
  height: 4px;
  border-radius: 2px;
  background: var(--md-sys-color-outline-variant);
  margin-bottom: var(--spacing-lg);
}

.update-icon {
  color: var(--md-sys-color-primary);
  margin-bottom: var(--spacing-md);
}

.update-title {
  font: var(--md-sys-typescale-title-medium);
  color: var(--md-sys-color-on-surface);
  margin: 0 0 var(--spacing-xs);
}

.update-text {
  font: var(--md-sys-typescale-body-medium);
  color: var(--md-sys-color-on-surface-variant);
  margin: 0 0 var(--spacing-lg);
}

.update-actions {
  display: flex;
  gap: var(--spacing-sm);
  width: 100%;
  justify-content: center;
}

/* Transitions */
.scrim-fade-enter-active,
.scrim-fade-leave-active {
  transition: opacity var(--motion-duration-medium) var(--motion-easing-standard);
}
.scrim-fade-enter-from,
.scrim-fade-leave-to {
  opacity: 0;
}

.sheet-fly-enter-active {
  transition:
    opacity var(--motion-duration-enter) var(--motion-easing-out),
    transform var(--motion-duration-enter) var(--motion-easing-out);
}
.sheet-fly-leave-active {
  transition:
    opacity var(--motion-duration-exit) var(--motion-easing-standard),
    transform var(--motion-duration-exit) var(--motion-easing-standard);
}
.sheet-fly-enter-from {
  opacity: 0;
  transform: translateY(100%);
}
.sheet-fly-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

@supports (padding: env(safe-area-inset-bottom)) {
  .update-sheet {
    padding-bottom: calc(var(--spacing-xl) + env(safe-area-inset-bottom));
  }
}
</style>
