<template>
  <section v-if="trimmedText" class="result-section documentation-section">
    <h3 class="section-title">Documenteer (voor EPD)</h3>
    <div class="documentation-content">
      <pre class="documentation-text">{{ trimmedText }}</pre>
      <CopyAction
        class="documentation-copy-action"
        :text="trimmedText"
        label="Kopieer"
        @copied="emit('copied')"
        @error="emit('error', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CopyAction from "../molecules/CopyAction.vue";

const props = defineProps<{
  text: string;
}>();

const emit = defineEmits<{
  copied: [];
  error: [error: unknown];
}>();

const trimmedText = computed(() => props.text.trim());
</script>

<style scoped>
.section-title {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  color: var(--md-sys-color-primary);
  font: var(--md-sys-typescale-title-medium);
}

.documentation-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  background-color: var(--md-sys-color-surface-container);
}

.documentation-text {
  flex-grow: 1;
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: "SF Mono", "Menlo", "Consolas", monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.documentation-copy-action {
  flex-shrink: 0;
}

@container result-main (max-width: 30rem) {
  .documentation-content {
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
  }

  .documentation-copy-action {
    width: 100%;
  }
}
</style>
