<template>
  <div class="card" :class="[`card--${variant}`]">
    <slot />
  </div>
</template>

<script setup lang="ts">
type Variant = "plain" | "elevated" | "outlined" | "accent";

withDefaults(
  defineProps<{
    variant?: Variant;
  }>(),
  { variant: "plain" },
);
</script>

<style scoped>
.card {
  background: var(--md-sys-color-surface-container-low);
  border-radius: var(--md-sys-shape-corner-medium);
  color: var(--md-sys-color-on-surface);
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
  border: 1px solid var(--md-sys-color-outline-variant);
  border-left: 3px solid var(--md-sys-color-primary);
}
</style>
