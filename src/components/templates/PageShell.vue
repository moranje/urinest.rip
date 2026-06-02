<template>
  <div id="app">
    <a href="#main-content" class="skip-link">Naar inhoud springen</a>
    <AppHeader :droplet-animate="dropletAnimate" />
    <main id="main-content" class="app-content" tabindex="-1">
      <section v-if="appError" class="app-error" role="alert" aria-live="assertive">
        <h1>Er ging iets mis</h1>
        <p>{{ appError }}</p>
        <Button @click="emit('reload')">Opnieuw laden</Button>
      </section>
      <slot v-else />
    </main>
    <OfflineBanner />
    <ToastContainer />
    <UpdatePrompt />
  </div>
</template>

<script setup lang="ts">
import AppHeader from "../organisms/AppHeader.vue";
import Button from "../primitives/Button.vue";
import OfflineBanner from "../OfflineBanner.vue";
import ToastContainer from "../ToastContainer.vue";
import UpdatePrompt from "../UpdatePrompt.vue";

withDefaults(
  defineProps<{
    dropletAnimate?: boolean;
    appError?: string | null;
  }>(),
  {
    dropletAnimate: false,
    appError: null,
  },
);

const emit = defineEmits<{
  reload: [];
}>();
</script>

<style>
#app {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
  height: 100svh;
  height: 100dvh;
  min-height: 100lvh;
  overflow: hidden;
  background-color: var(--md-sys-color-background);
  color: var(--md-sys-color-on-background);
}

.app-content {
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  contain: layout style paint;
}

body {
  overflow: hidden;
}

.skip-link {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: calc(var(--z-toast) + 100);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--md-sys-shape-corner-small);
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  font: var(--md-sys-typescale-label-large);
  text-decoration: none;
  transform: translateY(-200%);
  transition: transform var(--motion-duration-short) var(--motion-easing-standard);
}

.skip-link:focus-visible,
.skip-link:focus {
  transform: translateY(0);
}

#main-content:focus {
  outline: none;
}

.app-error {
  width: min(100% - var(--spacing-lg), 42rem);
  padding: var(--spacing-lg);
  margin: var(--spacing-xl) auto;
  border: 1px solid var(--md-sys-color-error);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}
</style>
