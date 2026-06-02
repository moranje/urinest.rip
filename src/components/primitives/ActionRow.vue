<template>
  <button type="button" class="action-row" :disabled="disabled" @click="emit('click')">
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{
  click: [];
}>();
</script>

<style scoped>
.action-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  box-sizing: border-box;
  width: 100%;
  min-height: var(--min-touch-target);
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-lowest);
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition: background-color var(--motion-duration-short) var(--motion-easing-standard);
}

.action-row:hover:not(:disabled) {
  background: var(--md-sys-color-surface-container);
}

.action-row:disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  cursor: not-allowed;
}

@media (max-width: 599.98px) {
  .action-row {
    padding: var(--spacing-sm) var(--spacing-md);
  }
}
</style>
