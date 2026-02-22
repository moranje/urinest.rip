<template>
  <div id="app">
    <app-header :hidden="headerHidden" :droplet-animate="dropletAnimate" />
    <main class="app-content" ref="scrollContainer">
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
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
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
  // Use nextTick-like delay to re-trigger animation
  requestAnimationFrame(() => {
    dropletAnimate.value = true
  })
})

// Header scroll-hide (mobile only)
const headerHidden = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)
let lastScrollY = 0
let isMobile = false

function handleScroll() {
  if (!scrollContainer.value || !isMobile) {
    headerHidden.value = false
    return
  }
  const y = scrollContainer.value.scrollTop
  if (y > 60) {
    headerHidden.value = y > lastScrollY
  } else {
    headerHidden.value = false
  }
  lastScrollY = y
}

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

  const mql = window.matchMedia('(max-width: 599px)')
  isMobile = mql.matches
  mql.addEventListener('change', (e) => {
    isMobile = e.matches
    if (!e.matches) headerHidden.value = false
  })
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleScroll, { passive: true })
  }
})

onBeforeUnmount(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleScroll)
  }
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
