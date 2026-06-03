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
    <span class="checkbox-field__box" aria-hidden="true" />
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
  grid-template-columns: var(--min-touch-target) 1fr;
  align-items: start;
  gap: var(--spacing-sm);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
}

.checkbox-field__control {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  width: 22px;
  height: 22px;
  margin: calc((var(--min-touch-target) - 22px) / 2);
  opacity: 0;
  cursor: inherit;
}

.checkbox-field__box {
  position: relative;
  width: 28px;
  height: 28px;
  margin: calc((var(--min-touch-target) - 28px) / 2);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    box-shadow var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard);
}

.checkbox-field__box::after {
  position: absolute;
  inset-block-start: 4px;
  inset-inline-start: 9px;
  width: 7px;
  height: 14px;
  border-color: var(--md-sys-color-on-primary-container);
  border-style: solid;
  border-width: 0 3px 3px 0;
  content: "";
  opacity: 0;
  transform: rotate(45deg) scale(0.7);
  transition:
    opacity var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard);
}

.checkbox-field__control:checked + .checkbox-field__box {
  background: var(--md-sys-color-primary-container);
}

.checkbox-field__control:checked + .checkbox-field__box::after {
  opacity: 1;
  transform: rotate(45deg) scale(1);
}

.checkbox-field__control:focus-visible + .checkbox-field__box {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 36%, transparent);
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
