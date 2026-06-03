<template>
  <component :is="tag" class="card" :class="[`card--${variant}`]">
    <slot />
  </component>
</template>

<script setup lang="ts">
type Variant = "plain" | "elevated" | "outlined" | "accent";
type CardTag = "div" | "section" | "article";

withDefaults(
  defineProps<{
    variant?: Variant;
    tag?: CardTag;
  }>(),
  { variant: "plain", tag: "div" },
);
</script>

<style scoped>
.card {
  background: var(--md-sys-color-surface-container-low);
  border: 0;
  border-radius: var(--md-sys-shape-corner-medium);
  color: var(--md-sys-color-on-surface);
  overflow: hidden;
  padding: var(--spacing-md);
}

.card--plain {
  background: var(--md-sys-color-surface-container-low);
}

.card--elevated {
  background: var(--md-sys-color-surface-container-low);
  box-shadow: var(--md-sys-elevation-1);
}

.card--outlined {
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
}

.card--accent {
  background: var(--md-sys-color-surface-container-low);
  padding-block: clamp(24px, 4vw, 36px);
  padding-inline: clamp(32px, 5vw, 48px);
  box-shadow: inset 4px 0 0 var(--md-sys-color-primary);
}
</style>
