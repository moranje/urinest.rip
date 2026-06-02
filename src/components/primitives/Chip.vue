<template>
  <a
    v-if="href"
    class="chip"
    :class="[`chip--${variant}`, 'chip--interactive']"
    :href="href"
    :target="target"
    :rel="computedRel"
  >
    <Icon v-if="icon" :name="icon" :size="14" aria-hidden="true" />
    <span class="chip__label"><slot /></span>
  </a>
  <span v-else class="chip" :class="`chip--${variant}`">
    <Icon v-if="icon" :name="icon" :size="14" aria-hidden="true" />
    <span class="chip__label"><slot /></span>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Icon from "./Icon.vue";

type IconName = InstanceType<typeof Icon>["$props"]["name"];

const props = withDefaults(
  defineProps<{
    variant?: "filled" | "outlined";
    icon?: IconName;
    href?: string;
    target?: "_blank" | "_self" | "_parent" | "_top";
    rel?: string;
  }>(),
  {
    variant: "filled",
    icon: undefined,
    href: undefined,
    target: "_blank",
    rel: undefined,
  },
);

const computedRel = computed(
  () => props.rel ?? (props.target === "_blank" ? "noopener noreferrer" : undefined),
);
</script>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  box-sizing: border-box;
  max-width: 100%;
  min-height: var(--min-touch-target);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-full);
  font: var(--md-sys-typescale-label-small);
  text-decoration: none;
  transition:
    background-color var(--motion-duration-medium) var(--motion-easing-standard),
    border-color var(--motion-duration-medium) var(--motion-easing-standard),
    color var(--motion-duration-medium) var(--motion-easing-standard);
}

.chip svg {
  flex-shrink: 0;
}

.chip__label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.chip--filled {
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface-variant);
}

.chip--outlined {
  border-color: var(--md-sys-color-primary);
  background-color: transparent;
  color: var(--md-sys-color-primary);
}

.chip--interactive:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}
</style>
