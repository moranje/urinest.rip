<template>
  <div class="question-toolbar">
    <button
      v-if="hasHistory"
      class="question-toolbar__back"
      type="button"
      aria-label="Vorige vraag (Esc of Backspace)"
      @click="emit('back')"
    >
      <Icon name="arrow-left" :size="20" />
      Terug
    </button>
    <span class="question-toolbar__spacer" />
    <button
      v-if="hasHistory"
      class="question-toolbar__restart"
      type="button"
      aria-label="Opnieuw beginnen"
      @click="emit('restart')"
    >
      <Icon name="restart" :size="18" />
    </button>
  </div>
</template>

<script setup lang="ts">
import Icon from "../primitives/Icon.vue";

defineProps<{
  hasHistory: boolean;
}>();

const emit = defineEmits<{
  back: [];
  restart: [];
}>();
</script>

<style scoped>
.question-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.question-toolbar__spacer {
  flex: 1;
}

.question-toolbar__back {
  min-height: var(--min-touch-target);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  border-radius: var(--md-sys-shape-corner-small);
  background: transparent;
  color: var(--md-sys-color-primary);
  cursor: pointer;
  font: var(--md-sys-typescale-label-large);
  transition: background-color var(--motion-duration-medium) var(--motion-easing-standard);
}

.question-toolbar__back:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}

.question-toolbar__back:active {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
}

.question-toolbar__restart {
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  transition: background-color var(--motion-duration-medium) var(--motion-easing-standard);
}

.question-toolbar__restart:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 8%, transparent);
  color: var(--md-sys-color-on-surface);
}
</style>
