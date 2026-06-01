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
  position: relative;
  overflow: hidden;
  background: var(--md-sys-color-surface-container-high);
  border-radius: var(--md-sys-shape-corner-extra-small);
}

.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--md-sys-color-surface) 55%, transparent),
    transparent
  );
  animation: skeleton-shimmer 1500ms var(--motion-easing-standard) infinite;
  will-change: transform;
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

:global(:where([data-tab-hidden="true"])) .skeleton::after {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    opacity: 0.75;
  }

  .skeleton::after {
    animation: none;
  }
}
</style>
