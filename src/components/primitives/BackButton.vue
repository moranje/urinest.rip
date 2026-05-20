<template>
  <button type="button" class="back-button" :aria-label="ariaLabel" @click="onClick">
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
    <span class="back-button-label"><slot>Terug</slot></span>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    ariaLabel?: string;
  }>(),
  { ariaLabel: "Terug" },
);

const emit = defineEmits<{ (e: "click"): void }>();

const onClick = (): void => emit("click");

// Reference props to satisfy strict TS
void props;
</script>

<style scoped>
.back-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  background: transparent;
  color: var(--md-sys-color-primary);
  font: var(--md-sys-typescale-label-large);
  cursor: pointer;
  border-radius: var(--md-sys-shape-corner-small);
  min-height: var(--min-touch-target);
  transition: background-color var(--motion-duration-medium) var(--motion-easing-standard);
}
.back-button:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}
.back-button:active {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
}
</style>
