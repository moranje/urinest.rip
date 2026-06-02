<template>
  <a
    v-if="url"
    class="source-chip source-chip--link"
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Icon name="file-text" :size="14" />
    <span>{{ name }}</span>
  </a>
  <span v-else class="source-chip source-chip--text">
    <Icon name="file-text" :size="14" />
    <span>{{ name }}</span>
  </span>
</template>

<script setup lang="ts">
import Icon from "../primitives/Icon.vue";

defineProps<{
  name: string;
  url?: string;
}>();
</script>

<style scoped>
.source-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  box-sizing: border-box;
  max-width: 100%;
  min-height: var(--min-touch-target);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-label-small);
  text-decoration: none;
  transition:
    background-color var(--motion-duration-medium) var(--motion-easing-standard),
    border-color var(--motion-duration-medium) var(--motion-easing-standard),
    color var(--motion-duration-medium) var(--motion-easing-standard);
}

.source-chip svg {
  flex-shrink: 0;
}

.source-chip span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.source-chip--link {
  border-color: var(--md-sys-color-primary);
  background-color: transparent;
  color: var(--md-sys-color-primary);
}

.source-chip--link:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}
</style>
