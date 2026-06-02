<template>
  <div class="error-page">
    <div class="error-content">
      <h1>Er is iets misgegaan</h1>
      <p>{{ message || "Een onverwachte fout is opgetreden." }}</p>
      <div class="error-actions">
        <Button v-if="retryTarget" @click="retry">Probeer opnieuw</Button>
        <Button variant="outlined" @click="goHome">Naar home</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "../components/primitives/Button.vue";

const route = useRoute();
const router = useRouter();
const message = route.query.message as string | undefined;
const retryTarget = computed(() => {
  const retry = route.query.retry;
  return typeof retry === "string" && retry.startsWith("/") ? retry : null;
});

const retry = (): void => {
  if (retryTarget.value) router.replace(retryTarget.value);
};

const goHome = (): void => {
  router.replace("/");
};
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

.error-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}
</style>
