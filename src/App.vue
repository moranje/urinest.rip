<template>
  <div id="app">
    <app-header :droplet-animate="dropletAnimate" />
    <main class="app-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <ToastContainer />
    <UpdatePrompt />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import ToastContainer from './components/ToastContainer.vue'
import UpdatePrompt from './components/UpdatePrompt.vue'
import { useQuestionnaireStore } from './store/questionnaireStore'
import { handleError } from './lib/errors'

const route = useRoute()
const questionnaireStore = useQuestionnaireStore()

// Droplet animation on route change
const dropletAnimate = ref(false)
watch(() => route.path, () => {
  dropletAnimate.value = false
  requestAnimationFrame(() => {
    dropletAnimate.value = true
  })
})

onMounted(async () => {
  try {
    await questionnaireStore.loadInitialData()
  } catch (error) {
    handleError(error, 'app:load-data')
  }

  // Dark mode: follow system preference
  const themeMql = window.matchMedia('(prefers-color-scheme: dark)')
  themeMql.addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
  })
})
</script>

<style>
@import './styles/main.css';

#app {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background-color: var(--md-sys-color-background);
  color: var(--md-sys-color-on-background);
}

.app-content {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  position: relative;
  contain: layout style paint;
}

.fade-enter-active {
  transition:
    opacity var(--motion-duration-enter) var(--motion-easing-out),
    transform var(--motion-duration-enter) var(--motion-easing-out);
  will-change: opacity, transform;
}

.fade-leave-active {
  transition:
    opacity var(--motion-duration-exit) var(--motion-easing-standard),
    transform var(--motion-duration-exit) var(--motion-easing-standard);
  will-change: opacity, transform;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

body {
  overflow: hidden;
}
</style>
