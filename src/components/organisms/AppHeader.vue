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
        <IconButton
          to="/over"
          :aria-current="isAboutActive ? 'page' : undefined"
          icon="info-circle"
          size="md"
          title="Over"
          aria-label="Over deze beslishulp"
        />
        <IconButton
          :to="isAuthenticated ? '/admin/logs' : '/admin/login'"
          :aria-current="isAdminActive ? 'page' : undefined"
          icon="settings"
          size="md"
          title="Admin"
          aria-label="Admin"
        />
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import RoleToggle from "../RoleToggle.vue";
import LogoSvg from "../LogoSvg.vue";
import IconButton from "../primitives/IconButton.vue";
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
  min-height: var(--min-touch-target);
  padding: 0;
  color: inherit;
  text-decoration: none;
  text-underline-offset: 0.35em;
}

.app-title-link:hover {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-decoration-color: var(--md-sys-color-primary);
}

.app-title-link:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: var(--spacing-xs);
}

@media (max-width: 599.98px) {
  .app-header {
    padding: 0 var(--spacing-sm);
  }
}
</style>
