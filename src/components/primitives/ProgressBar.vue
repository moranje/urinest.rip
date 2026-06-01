<template>
  <div
    class="progress-bar"
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="value"
    :aria-label="label"
  >
    <div class="progress-bar-track" aria-hidden="true">
      <div class="progress-bar-fill" :style="{ width: percentage + '%' }" />
    </div>
    <span v-if="showText" class="progress-bar-text">{{ text ?? `${value} / ${max}` }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    value: number;
    max: number;
    label?: string;
    text?: string;
    showText?: boolean;
  }>(),
  {
    label: "Voortgang",
    showText: false,
  },
);

const percentage = computed(() => {
  if (props.max <= 0) return 0;
  const v = Math.max(0, Math.min(props.value, props.max));
  return Math.round((v / props.max) * 100);
});
</script>

<style scoped>
.progress-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.progress-bar-track {
  flex: 1;
  min-width: 96px;
  height: 6px;
  background: var(--md-sys-color-surface-container-high);
  border-radius: var(--md-sys-shape-corner-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--md-sys-color-primary);
  border-radius: var(--md-sys-shape-corner-full);
  transition: width var(--motion-duration-medium) var(--motion-easing-out);
}

.progress-bar-text {
  font: var(--md-sys-typescale-label-small);
  color: var(--md-sys-color-on-surface-variant);
  min-width: 3.5em;
  white-space: nowrap;
  text-align: right;
}
</style>
