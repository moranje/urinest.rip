<template>
  <label class="select-field" :for="fieldId">
    <span v-if="label" class="select-field__label">{{ label }}</span>
    <select
      :id="fieldId"
      :name="name"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      class="select-field__control"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>
    <span v-if="error" :id="errorId" class="select-field__support select-field__support--error">
      {{ error }}
    </span>
    <span v-else-if="hint" :id="hintId" class="select-field__support">{{ hint }}</span>
  </label>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    options: readonly SelectOption[];
    label?: string;
    id?: string;
    name?: string;
    placeholder?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    modelValue: "",
    label: "",
    id: undefined,
    name: undefined,
    placeholder: "",
    hint: "",
    error: "",
    disabled: false,
    required: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const fallbackId = useId();
const fieldId = computed(() => props.id ?? `select-${fallbackId}`);
const hintId = computed(() => `${fieldId.value}-hint`);
const errorId = computed(() => `${fieldId.value}-error`);
const describedBy = computed(() =>
  props.error ? errorId.value : props.hint ? hintId.value : undefined,
);
</script>

<style scoped>
.select-field {
  display: grid;
  gap: var(--spacing-xs);
  color: var(--md-sys-color-on-surface);
}

.select-field__label {
  font: var(--md-sys-typescale-label-large);
}

.select-field__control {
  min-height: var(--min-touch-target);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  padding: 0 var(--spacing-xl) 0 var(--spacing-md);
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container-low);
  font: var(--md-sys-typescale-body-large);
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    border-color var(--motion-duration-short) var(--motion-easing-standard),
    box-shadow var(--motion-duration-short) var(--motion-easing-standard);
}

.select-field__control:hover:not(:disabled) {
  border-color: var(--md-sys-color-on-surface-variant);
}

.select-field__control:focus-visible {
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-sys-color-primary) 24%, transparent);
}

.select-field__control:disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
  cursor: not-allowed;
}

.select-field__control[aria-invalid="true"] {
  border-color: var(--md-sys-color-error);
}

.select-field__support {
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-body-small);
}

.select-field__support--error {
  color: var(--md-sys-color-error);
}
</style>
