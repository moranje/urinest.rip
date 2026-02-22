<template>
  <div class="error-page">
    <div class="error-content">
      <h2>Er is iets misgegaan</h2>
      <p>{{ message || 'Een onverwachte fout is opgetreden.' }}</p>
      <router-link to="/" class="md-button md-button--primary">Terug naar home</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
const message = route.query.message as string | undefined
</script>

<style scoped>
.error-page {
  padding: var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
.error-content {
  text-align: center;
}
.error-content h2 {
  color: var(--md-sys-color-error);
  margin-bottom: var(--spacing-md);
}
.error-content p {
  margin-bottom: var(--spacing-lg);
  color: var(--md-sys-color-on-surface-variant);
}
</style>
