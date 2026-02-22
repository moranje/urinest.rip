<template>
  <Teleport to="body">
    <Transition name="scrim-fade">
      <div v-if="needRefresh" class="update-scrim" @click="handleDismiss" />
    </Transition>
    <Transition name="sheet-fly">
      <div v-if="needRefresh" class="update-sheet">
        <div class="drag-indicator" />
        <div class="update-icon">
          <svg v-if="!updating" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <svg v-else class="spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-6.22-8.56" />
          </svg>
        </div>
        <h3 class="update-title">{{ updating ? 'Bijwerken...' : 'Update beschikbaar' }}</h3>
        <p class="update-text">{{ updating ? 'Even geduld...' : 'Er is een nieuwe versie beschikbaar.' }}</p>
        <div class="update-actions">
          <button class="md-button md-button--primary" @click="handleUpdate" :disabled="updating">
            {{ updating ? 'Bijwerken...' : 'Nu bijwerken' }}
          </button>
          <button v-if="!updating" class="md-button md-button--text" @click="handleDismiss">
            Later
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
    if (!registration) return
    setInterval(async () => {
      if (registration.installing || !navigator.onLine) return
      await registration.update()
    }, UPDATE_CHECK_INTERVAL)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !registration.installing) {
        registration.update()
      }
    })
  }
})

onMounted(() => {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready.then((reg) => {
    if (reg.waiting) needRefresh.value = true
  })
})

const updating = ref(false)

function handleUpdate() {
  updating.value = true
  updateServiceWorker(true)
}

function handleDismiss() {
  needRefresh.value = false
}
</script>

<style scoped>
.update-scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
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

.spin {
  animation: spin 1.2s linear infinite;
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
  transition: all var(--motion-duration-enter) var(--motion-easing-out);
}
.sheet-fly-leave-active {
  transition: all var(--motion-duration-exit) var(--motion-easing-standard);
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
