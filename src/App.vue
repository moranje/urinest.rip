<template>
  <PageShell :droplet-animate="dropletAnimate" :app-error="appError" @reload="reloadApp">
    <router-view v-slot="{ Component, route: r }">
      <component :is="Component" :key="routeViewKey(r)" />
    </router-view>
  </PageShell>
</template>

<script setup lang="ts">
import PageShell from "./components/templates/PageShell.vue";
import { useAppShell } from "./composables/useAppShell";

const { appError, dropletAnimate, reloadApp, routeViewKey } = useAppShell();
</script>

<style>
@import "./styles/main.css";
</style>
