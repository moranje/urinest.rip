<template>
  <router-link v-if="to" v-slot="{ href: routerHref, navigate }" :to="to" custom>
    <a
      :href="disabled ? undefined : routerHref"
      :aria-label="buttonAriaLabel"
      :aria-pressed="ariaPressed"
      :aria-current="buttonAriaCurrent"
      :aria-disabled="disabled ? 'true' : undefined"
      :tabindex="disabled ? -1 : undefined"
      :title="title"
      :class="buttonClass"
      @click="handleRouterLink($event, navigate)"
    >
      <Icon :name="icon" :size="iconSize" aria-hidden="true" />
    </a>
  </router-link>
  <a
    v-else-if="href"
    :href="disabled ? undefined : href"
    :aria-label="buttonAriaLabel"
    :aria-pressed="ariaPressed"
    :aria-current="buttonAriaCurrent"
    :aria-disabled="disabled ? 'true' : undefined"
    :tabindex="disabled ? -1 : undefined"
    :title="title"
    :target="target"
    :rel="rel"
    :class="buttonClass"
    @click="handleDisabledLink"
  >
    <Icon :name="icon" :size="iconSize" aria-hidden="true" />
  </a>
  <button
    v-else
    :type="type"
    :disabled="disabled"
    :aria-label="buttonAriaLabel"
    :aria-pressed="ariaPressed"
    :aria-current="buttonAriaCurrent"
    :title="title"
    :class="buttonClass"
  >
    <Icon :name="icon" :size="iconSize" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { RouteLocationRaw } from "vue-router";
import Icon from "./Icon.vue";

type IconName = InstanceType<typeof Icon>["$props"]["name"];
type Variant = "standard" | "filled" | "tonal" | "outlined";
type Size = "sm" | "md" | "lg";
type AriaCurrent = "page" | "step" | "location" | "date" | "time" | "true" | "false" | boolean;
type RouterNavigate = (event?: MouseEvent) => void;

const props = withDefaults(
  defineProps<{
    icon: IconName;
    ariaLabel?: string;
    // eslint-disable-next-line vue/prop-name-casing
    "aria-label"?: string;
    ariaCurrent?: AriaCurrent;
    // eslint-disable-next-line vue/prop-name-casing
    "aria-current"?: AriaCurrent;
    variant?: Variant;
    size?: Size;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    ariaPressed?: boolean | "true" | "false" | "mixed";
    to?: RouteLocationRaw;
    href?: string;
    title?: string;
    target?: string;
    rel?: string;
  }>(),
  {
    variant: "standard",
    size: "md",
    type: "button",
    disabled: false,
    ariaLabel: undefined,
    "aria-label": undefined,
    ariaCurrent: undefined,
    "aria-current": undefined,
    ariaPressed: undefined,
    to: undefined,
    href: undefined,
    title: undefined,
    target: undefined,
    rel: undefined,
  },
);

const iconSize = computed(() => (props.size === "sm" ? 18 : props.size === "lg" ? 24 : 20));
const buttonAriaLabel = computed(() => props.ariaLabel ?? props["aria-label"]);
const buttonAriaCurrent = computed(() => props.ariaCurrent ?? props["aria-current"]);
const buttonClass = computed(() => [
  "icon-button",
  `icon-button--${props.variant}`,
  `icon-button--${props.size}`,
]);

function handleDisabledLink(event: MouseEvent) {
  if (!props.disabled) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
}

function handleRouterLink(event: MouseEvent, navigate: RouterNavigate) {
  if (props.disabled) {
    handleDisabledLink(event);
    return;
  }

  navigate(event);
}
</script>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--md-sys-shape-corner-full);
  border: 1px solid transparent;
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
  padding: 0;
  color: var(--md-sys-color-on-surface-variant);
  background: transparent;
  cursor: pointer;
  text-decoration: none;
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    border-color var(--motion-duration-short) var(--motion-easing-standard),
    color var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-press) var(--motion-easing-standard);
}

.icon-button--sm {
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
}

.icon-button--lg {
  min-width: 48px;
  min-height: 48px;
}

.icon-button--standard:hover:not(:disabled):not([aria-disabled="true"]) {
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
}

.icon-button--filled {
  color: var(--md-sys-color-on-primary);
  background: var(--md-sys-color-primary);
}

.icon-button--tonal {
  color: var(--md-sys-color-on-secondary-container);
  background: var(--md-sys-color-secondary-container);
}

.icon-button--outlined {
  color: var(--md-sys-color-on-surface-variant);
  border-color: var(--md-sys-color-outline);
}

.icon-button[aria-current="page"] {
  color: var(--md-sys-color-primary);
  background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
}

.icon-button:disabled,
.icon-button[aria-disabled="true"] {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
  cursor: not-allowed;
}

.icon-button:active:not(:disabled):not([aria-disabled="true"]) {
  transform: scale(0.96);
}
</style>
