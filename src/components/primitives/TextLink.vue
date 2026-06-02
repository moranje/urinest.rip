<template>
  <a
    class="text-link"
    :href="href"
    :target="computedTarget"
    :rel="computedRel"
    :aria-label="computedAriaLabel"
  >
    <slot />
  </a>
</template>

<script setup lang="ts">
import { computed } from "vue";

type LinkTarget = "_blank" | "_self" | "_parent" | "_top";

const props = withDefaults(
  defineProps<{
    href: string;
    external?: boolean;
    target?: LinkTarget;
    rel?: string;
    ariaLabel?: string;
    // eslint-disable-next-line vue/prop-name-casing
    "aria-label"?: string;
  }>(),
  {
    external: undefined,
    target: undefined,
    rel: undefined,
    ariaLabel: undefined,
    "aria-label": undefined,
  },
);

const isExternal = computed(() => props.external ?? /^https?:\/\//u.test(props.href));
const computedTarget = computed<LinkTarget | undefined>(
  () => props.target ?? (isExternal.value ? "_blank" : undefined),
);
const computedRel = computed(
  () => props.rel ?? (computedTarget.value === "_blank" ? "noopener noreferrer" : undefined),
);
const computedAriaLabel = computed(() => props.ariaLabel ?? props["aria-label"]);
</script>

<style scoped>
.text-link {
  color: var(--md-sys-color-primary);
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
  overflow-wrap: anywhere;
  transition:
    color var(--motion-duration-short) var(--motion-easing-standard),
    text-decoration-color var(--motion-duration-short) var(--motion-easing-standard);
}

.text-link:hover {
  color: var(--md-sys-color-on-primary-container);
  text-decoration-color: currentColor;
}

.text-link:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
  border-radius: var(--md-sys-shape-corner-extra-small);
}
</style>
