<template>
  <header class="app-header" :class="{ 'header-hidden': hidden }">
    <div class="header-content">
      <router-link to="/" class="app-title-link">
        <LogoSvg :size="28" :animate="dropletAnimate" />
      </router-link>

      <div class="header-actions">
        <role-toggle />
        <router-link to="/over" class="header-icon-link" title="Over">
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8z"
            />
          </svg>
        </router-link>
        <router-link v-if="isAuthenticated" to="/admin/logs" class="header-icon-link" title="Admin">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M19.14 12.94c.04-.3.06-.61.06-.94c0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6s3.6 1.62 3.6 3.6s-1.62 3.6-3.6 3.6"
            />
          </svg>
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import RoleToggle from './RoleToggle.vue'
import LogoSvg from './LogoSvg.vue'
import { useAuthStore } from '../store/authStore'

defineProps<{
  hidden?: boolean
  dropletAnimate?: boolean
}>()

const { isAuthenticated } = storeToRefs(useAuthStore())
</script>

<style scoped>
.app-header {
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  padding: 0 var(--spacing-md);
  box-shadow: var(--md-sys-elevation-1);
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  height: var(--layout-header-height);
  display: flex;
  align-items: center;
}

.header-content {
  max-width: var(--layout-content-max-width);
  margin: 0 auto;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.app-title-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-sm);
  margin: 0 calc(-1 * var(--spacing-sm));
  border-radius: var(--md-sys-shape-corner-small);
  transition: background-color var(--motion-duration-short) var(--motion-easing-standard);
}

.app-title-link:hover {
  background-color: var(--md-sys-color-surface-variant);
}

.header-icon-link {
  width: 40px;
  height: 40px;
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
  border-radius: var(--md-sys-shape-corner-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-sys-color-on-surface-variant);
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard);
}

.header-icon-link:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 8%, transparent);
}

.header-icon-link:active {
  transform: scale(0.9);
  transition-duration: var(--motion-duration-press);
}

@media (max-width: 599px) {
  .app-header {
    padding: 0 var(--spacing-sm);
    transition: transform var(--motion-duration-medium) var(--motion-easing-out);
  }
  .app-header.header-hidden {
    transform: translateY(-100%);
  }
}
</style>
