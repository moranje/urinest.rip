<template>
  <span class="tooltip">
    <slot
      name="trigger"
      :open="open"
      :show="show"
      :hide="hide"
      :toggle="toggle"
      :trigger-attrs="triggerAttrs"
    >
      <button v-bind="triggerAttrs" type="button" class="tooltip__trigger">
        <Icon name="info-circle" :size="18" />
      </button>
    </slot>
    <span v-if="open" :id="tooltipId" role="tooltip" class="tooltip__content">
      <slot />
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, useId } from "vue";
import Icon from "./Icon.vue";

const props = withDefaults(
  defineProps<{
    id?: string;
    ariaLabel?: string;
  }>(),
  {
    id: undefined,
    ariaLabel: "Meer informatie",
  },
);

const open = ref(false);
const fallbackId = useId();
const tooltipId = computed(() => props.id ?? `tooltip-${fallbackId}`);

const show = () => {
  open.value = true;
};

const hide = () => {
  open.value = false;
};

const toggle = () => {
  open.value = !open.value;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") hide();
};

const triggerAttrs = computed(() => ({
  "aria-describedby": open.value ? tooltipId.value : undefined,
  "aria-expanded": open.value,
  "aria-label": props.ariaLabel,
  onBlur: hide,
  onClick: toggle,
  onFocus: show,
  onKeydown,
  onMouseenter: show,
  onMouseleave: hide,
}));
</script>

<style scoped>
.tooltip {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.tooltip__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-on-surface-variant);
  background: transparent;
  cursor: pointer;
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    color var(--motion-duration-short) var(--motion-easing-standard);
}

.tooltip__trigger:hover {
  color: var(--md-sys-color-primary);
  background: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}

.tooltip__content {
  position: absolute;
  z-index: var(--z-popover);
  inset-block-start: calc(100% + var(--spacing-xs));
  inset-inline-start: 50%;
  width: max-content;
  max-width: min(320px, calc(100vw - var(--spacing-xl)));
  transform: translateX(-50%);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container-high);
  box-shadow: var(--md-sys-elevation-2);
  font: var(--md-sys-typescale-body-small);
}
</style>
