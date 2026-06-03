<template>
  <label class="checkbox-field" :class="{ 'checkbox-field--disabled': disabled }">
    <input
      :id="fieldId"
      :name="name"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      :required="required"
      :aria-describedby="description ? descriptionId : undefined"
      class="checkbox-field__control"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="checkbox-field__box" aria-hidden="true">
      <Icon class="checkbox-field__icon" name="check-circle" :size="20" />
    </span>
    <span class="checkbox-field__body">
      <span class="checkbox-field__label">{{ label }}</span>
      <span v-if="description" :id="descriptionId" class="checkbox-field__description">
        {{ description }}
      </span>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";
import Icon from "./Icon.vue";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    label: string;
    id?: string;
    name?: string;
    description?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    modelValue: false,
    id: undefined,
    name: undefined,
    description: "",
    disabled: false,
    required: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const fallbackId = useId();
const fieldId = computed(() => props.id ?? `checkbox-${fallbackId}`);
const descriptionId = computed(() => `${fieldId.value}-description`);
</script>

<style scoped>
.checkbox-field {
  position: relative;
  display: grid;
  grid-template-columns: calc(var(--min-touch-target) - 4px) minmax(0, 1fr);
  align-items: start;
  gap: var(--spacing-md);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
}

.checkbox-field__control {
  appearance: none;
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  width: 22px;
  height: 22px;
  margin: calc((var(--min-touch-target) - 22px) / 2);
  border: 0;
  outline: 0;
  opacity: 0;
  cursor: inherit;
}

.checkbox-field__box {
  position: relative;
  width: 32px;
  height: 32px;
  margin: calc((var(--min-touch-target) - 32px) / 2);
  border: 0;
  border-radius: 999px;
  outline: 0;
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
  box-shadow: none;
  overflow: hidden;
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard);
}

.checkbox-field__icon {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  color: var(--md-sys-color-primary);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.72);
  transition:
    opacity var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard);
}

.checkbox-field__control:checked + .checkbox-field__box {
  background: color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
}

.checkbox-field__control:checked + .checkbox-field__box .checkbox-field__icon {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.checkbox-field__control:focus-visible + .checkbox-field__box {
  background: color-mix(
    in srgb,
    var(--md-sys-color-primary-container) 56%,
    var(--md-sys-color-on-surface) 8%
  );
}

.checkbox-field:has(.checkbox-field__control:focus-visible) .checkbox-field__label {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

.checkbox-field:active .checkbox-field__box {
  transform: scale(0.96);
}

.checkbox-field__body {
  min-height: var(--min-touch-target);
  display: grid;
  align-content: center;
  gap: 2px;
}

.checkbox-field__label {
  font: var(--md-sys-typescale-body-large);
}

.checkbox-field__description {
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-body-small);
}

.checkbox-field--disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  cursor: not-allowed;
}

.checkbox-field--disabled .checkbox-field__box {
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 6%, transparent);
}

.checkbox-field--disabled .checkbox-field__description {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
}
</style>
