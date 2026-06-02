<template>
  <label class="input-field" :for="fieldId">
    <span v-if="label" class="input-field__label">{{ label }}</span>
    <input
      :id="fieldId"
      :name="name"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :enterkeyhint="enterkeyhint"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      class="input-field__control"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span
      v-if="error"
      :id="errorId"
      :role="errorRole"
      class="input-field__support input-field__support--error"
    >
      {{ error }}
    </span>
    <span v-else-if="hint" :id="hintId" class="input-field__support">{{ hint }}</span>
  </label>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    id?: string;
    name?: string;
    type?: "text" | "email" | "password" | "search" | "tel" | "url" | "number";
    placeholder?: string;
    hint?: string;
    error?: string;
    errorRole?: string;
    autocomplete?: string;
    inputmode?: "none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";
    enterkeyhint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    modelValue: "",
    label: "",
    id: undefined,
    name: undefined,
    type: "text",
    placeholder: "",
    hint: "",
    error: "",
    errorRole: undefined,
    autocomplete: undefined,
    inputmode: undefined,
    enterkeyhint: undefined,
    disabled: false,
    required: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const fallbackId = useId();
const fieldId = computed(() => props.id ?? `input-${fallbackId}`);
const hintId = computed(() => `${fieldId.value}-hint`);
const errorId = computed(() => `${fieldId.value}-error`);
const describedBy = computed(() =>
  props.error ? errorId.value : props.hint ? hintId.value : undefined,
);
</script>

<style scoped>
.input-field {
  display: grid;
  gap: var(--spacing-xs);
  color: var(--md-sys-color-on-surface);
}

.input-field__label {
  font: var(--md-sys-typescale-label-large);
}

.input-field__control {
  min-height: var(--min-touch-target);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  padding: 0 var(--spacing-md);
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container-low);
  font: var(--md-sys-typescale-body-large);
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    border-color var(--motion-duration-short) var(--motion-easing-standard),
    box-shadow var(--motion-duration-short) var(--motion-easing-standard);
}

.input-field__control:hover:not(:disabled) {
  border-color: var(--md-sys-color-on-surface-variant);
}

.input-field__control:focus-visible {
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-sys-color-primary) 24%, transparent);
}

.input-field__control:disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
  cursor: not-allowed;
}

.input-field__control[aria-invalid="true"] {
  border-color: var(--md-sys-color-error);
}

.input-field__support {
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-body-small);
}

.input-field__support--error {
  color: var(--md-sys-color-error);
}
</style>
