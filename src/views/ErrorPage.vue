<template>
  <div class="error-page">
    <Notice
      class="error-content"
      variant="error"
      title="Er is iets misgegaan"
      title-tag="h1"
      role="alert"
    >
      <p>{{ message || "Een onverwachte fout is opgetreden." }}</p>
      <template #action>
        <Button v-if="retryTarget" @click="retry">Probeer opnieuw</Button>
        <Button variant="outlined" @click="goHome">Naar home</Button>
      </template>
    </Notice>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Notice from "../components/molecules/Notice.vue";
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
  width: min(100%, 42rem);
}

.error-content p {
  margin: 0;
}
</style>
