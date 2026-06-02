<template>
  <div class="result-template">
    <section class="result-template__main" aria-label="Resultaat">
      <div
        v-if="isLoading"
        class="result-template__content"
        aria-busy="true"
        aria-label="Resultaat laden"
      >
        <div class="result-template__section">
          <Skeleton variant="badge" />
          <Skeleton variant="title" />
          <Skeleton variant="line" />
          <Skeleton variant="line" />
          <Skeleton variant="short" />
        </div>
        <div class="result-template__section">
          <Skeleton variant="title" width="50%" />
          <Skeleton variant="line" />
          <Skeleton variant="short" />
        </div>
      </div>

      <Notice
        v-else-if="error"
        class="result-template__error"
        variant="error"
        title="Resultaat niet gevonden"
        title-tag="h1"
        role="alert"
      >
        <p>{{ error }}</p>
      </Notice>

      <div v-else-if="result" class="result-template__content">
        <ResultSectionList :result="result">
          <template #after-additional>
            <ContraindicationGate
              :contraindications="result.contraindications"
              :treatment="result.treatment"
            />
          </template>

          <DocumentationCopyPanel
            :text="documentation"
            @copied="emit('documentationCopied')"
            @error="emit('documentationError', $event)"
          />
        </ResultSectionList>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import ContraindicationGate from "../organisms/ContraindicationGate.vue";
import DocumentationCopyPanel from "../organisms/DocumentationCopyPanel.vue";
import ResultSectionList from "../organisms/ResultSectionList.vue";
import Notice from "../molecules/Notice.vue";
import Skeleton from "../primitives/Skeleton.vue";
import type { ResultData } from "../../types";

withDefaults(
  defineProps<{
    isLoading: boolean;
    error?: string | null;
    result?: ResultData | null;
    documentation?: string;
  }>(),
  {
    error: null,
    result: null,
    documentation: "",
  },
);

const emit = defineEmits<{
  documentationCopied: [];
  documentationError: [error: unknown];
}>();
</script>

<style scoped>
.result-template {
  display: flex;
  flex-direction: column;
}

.result-template__main {
  width: 100%;
  max-width: var(--layout-content-max-width);
  flex: 1;
  box-sizing: border-box;
  padding: var(--spacing-lg) var(--spacing-md);
  margin: 0 auto;
  contain: layout style paint;
  container-type: inline-size;
  container-name: result-main;
}

.result-template__content {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.result-template__section {
  padding: 0;
}

.result-template__error {
  width: 100%;
}

.result-template__content > * {
  opacity: 0;
  animation: motion-enter-up var(--motion-duration-enter) var(--motion-easing-out) forwards;
}

.result-template__content > *:nth-child(1) {
  animation-delay: 30ms;
}

.result-template__content > *:nth-child(2) {
  animation-delay: 60ms;
}

.result-template__content > *:nth-child(3) {
  animation-delay: 90ms;
}

.result-template__content > *:nth-child(4) {
  animation-delay: 120ms;
}

.result-template__content > *:nth-child(5) {
  animation-delay: 150ms;
}

.result-template__content > *:nth-child(6) {
  animation-delay: 180ms;
}

.result-template__content > *:nth-child(7) {
  animation-delay: 210ms;
}

.result-template__content > *:nth-child(8) {
  animation-delay: 240ms;
}

@media (prefers-reduced-motion: reduce) {
  .result-template__content > * {
    opacity: 1;
    animation: none;
  }
}

@container result-main (max-width: 37.5rem) {
  .result-template__main {
    padding: var(--spacing-sm);
  }

  .result-template__content {
    gap: var(--spacing-sm);
  }
}
</style>
