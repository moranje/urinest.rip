<template>
  <teleport to="body">
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
    <div
      v-if="activeOptionId"
      class="info-popover"
      :id="`option-info-${activeOptionId}`"
      :style="normalizedStyle"
      role="dialog"
      aria-label="Meer informatie"
      tabindex="-1"
      @mouseenter="emit('cancelClose')"
      @mouseleave="emit('scheduleClose')"
      @focusin="emit('cancelClose')"
      @focusout="emit('scheduleClose')"
    >
      <!-- eslint-disable vue/no-v-html -- sanitized Markdown from compiled YAML -->
      <div v-html="html" />
      <!-- eslint-enable vue/no-v-html -->
      <IconButton
        class="info-popover__close-action"
        data-testid="info-popover-close"
        icon="x"
        size="sm"
        aria-label="Informatie sluiten"
        @click="emit('close')"
      />
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import IconButton from "../primitives/IconButton.vue";
import type { PopoverStyle } from "../../types";
import type { StyleValue } from "vue";

const props = defineProps<{
  activeOptionId: string | null;
  html: string;
  popoverStyle: PopoverStyle;
}>();

const emit = defineEmits<{
  cancelClose: [];
  scheduleClose: [];
  close: [];
}>();

const normalizedStyle = computed(() => props.popoverStyle as StyleValue);
</script>

<style scoped>
.info-popover {
  width: max-content;
  max-width: 300px;
  max-height: 300px;
  padding: var(--spacing-md) calc(var(--spacing-md) + var(--min-touch-target)) var(--spacing-md)
    var(--spacing-md);
  border-radius: var(--md-sys-shape-corner-medium);
  background-color: var(--md-sys-color-surface);
  box-shadow: var(--md-sys-elevation-3);
  color: var(--md-sys-color-on-surface);
  font: var(--md-sys-typescale-body-small);
  opacity: 0;
  overflow-y: auto;
  pointer-events: auto;
  text-align: left;
  transition: opacity var(--motion-duration-medium) var(--motion-easing-standard);
  visibility: hidden;
  z-index: 1000;
}

.info-popover__close-action {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
}
</style>
