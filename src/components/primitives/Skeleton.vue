<template>
  <div class="skeleton" :class="[`skeleton--${variant}`]" :style="customStyle" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed } from "vue";

type Variant = "line" | "title" | "short" | "option" | "badge";

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    width?: string;
    height?: string;
  }>(),
  { variant: "line" },
);

const customStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.width) style.width = props.width;
  if (props.height) style.height = props.height;
  return style;
});
</script>

<style scoped>
.skeleton {
  background: var(--md-sys-color-surface-container-high);
  border-radius: var(--md-sys-shape-corner-extra-small);
  animation: skeleton-shimmer var(--motion-duration-long) ease-in-out infinite alternate;
}

.skeleton--line {
  height: 14px;
  width: 100%;
}

.skeleton--title {
  height: 24px;
  width: 70%;
  margin-bottom: var(--spacing-md);
}

.skeleton--short {
  height: 14px;
  width: 40%;
}

.skeleton--option {
  height: 56px;
  border-radius: var(--md-sys-shape-corner-small);
}

.skeleton--badge {
  height: 24px;
  width: 80px;
  border-radius: 9999px;
  margin-bottom: 12px;
}

/* Pause animation when tab is hidden — saves paint cost */
:global(:where([data-tab-hidden="true"])) .skeleton {
  animation-play-state: paused;
}
</style>
