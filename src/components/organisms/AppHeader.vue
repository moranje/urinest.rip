<template>
  <header class="app-header">
    <div class="header-content">
      <router-link
        to="/"
        class="app-title-link"
        :aria-current="isLandingActive ? 'page' : undefined"
        aria-label="Home"
      >
        <LogoSvg :size="28" :animate="dropletAnimate" />
      </router-link>

      <nav class="header-actions" aria-label="Hoofdnavigatie">
        <RoleToggle />
        <ThemeToggle />
        <router-link
          to="/over"
          class="header-icon-link"
          :aria-current="isAboutActive ? 'page' : undefined"
          title="Over"
          aria-label="Over deze beslishulp"
        >
          <Icon name="info-circle" :size="24" />
        </router-link>
        <router-link
          :to="isAuthenticated ? '/admin/logs' : '/admin/login'"
          class="header-icon-link"
          :aria-current="isAdminActive ? 'page' : undefined"
          title="Admin"
          aria-label="Admin"
        >
          <Icon name="settings" :size="22" />
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import RoleToggle from "../RoleToggle.vue";
import ThemeToggle from "../ThemeToggle.vue";
import LogoSvg from "../LogoSvg.vue";
import Icon from "../primitives/Icon.vue";
import { useAuthStore } from "../../store/authStore";

defineProps<{
  dropletAnimate?: boolean;
}>();

const { isAuthenticated } = storeToRefs(useAuthStore());
const route = useRoute();

const isLandingActive = computed(() => route.path === "/");
const isAboutActive = computed(() => route.path === "/over");
const isAdminActive = computed(() => route.path.startsWith("/admin"));
</script>

<style scoped>
.app-header {
  height: var(--layout-header-height);
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  padding: 0 var(--spacing-md);
  background-color: var(--md-sys-color-surface);
  box-shadow: var(--md-sys-elevation-1);
  color: var(--md-sys-color-on-surface);
}

.header-content {
  width: 100%;
  max-width: var(--layout-content-max-width);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.app-title-link {
  display: flex;
  align-items: center;
  margin: 0 calc(-1 * var(--spacing-sm));
  padding: 0 var(--spacing-sm);
  border-radius: var(--md-sys-shape-corner-small);
  color: inherit;
  text-decoration: none;
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
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--md-sys-shape-corner-full);
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

.header-icon-link[aria-current="page"] {
  color: var(--md-sys-color-primary);
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
}

@media (max-width: 599.98px) {
  .app-header {
    padding: 0 var(--spacing-sm);
  }
}
</style>
