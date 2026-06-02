<template>
  <label class="radio-field" :class="{ 'radio-field--disabled': disabled }">
    <input
      :id="fieldId"
      :name="name"
      type="radio"
      :value="value"
      :checked="modelValue === value"
      :disabled="disabled"
      :required="required"
      :aria-describedby="description ? descriptionId : undefined"
      class="radio-field__control"
      @change="emit('update:modelValue', value)"
    />
    <span class="radio-field__body">
      <span class="radio-field__label">{{ label }}</span>
      <span v-if="description" :id="descriptionId" class="radio-field__description">
        {{ description }}
      </span>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    value: string;
    label: string;
    id?: string;
    name?: string;
    description?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    modelValue: "",
    id: undefined,
    name: undefined,
    description: "",
    disabled: false,
    required: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const fallbackId = useId();
const fieldId = computed(() => props.id ?? `radio-${fallbackId}`);
const descriptionId = computed(() => `${fieldId.value}-description`);
</script>

<style scoped>
.radio-field {
  display: grid;
  grid-template-columns: var(--min-touch-target) 1fr;
  align-items: start;
  gap: var(--spacing-sm);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
}

.radio-field__control {
  width: 22px;
  height: 22px;
  margin: calc((var(--min-touch-target) - 22px) / 2);
  accent-color: var(--md-sys-color-primary);
}

.radio-field__body {
  min-height: var(--min-touch-target);
  display: grid;
  align-content: center;
  gap: 2px;
}

.radio-field__label {
  font: var(--md-sys-typescale-body-large);
}

.radio-field__description {
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-body-small);
}

.radio-field--disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  cursor: not-allowed;
}

.radio-field--disabled .radio-field__description {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
}
</style>
