<template>
  <fieldset
    v-if="variant === 'group'"
    class="form-field form-field--group"
    :class="{ 'form-field--disabled': disabled, 'form-field--invalid': Boolean(error) }"
    :disabled="disabled"
    :aria-describedby="describedBy"
  >
    <legend v-if="label" class="form-field__label">
      {{ label }}
      <span v-if="required" class="form-field__required" aria-hidden="true">*</span>
    </legend>
    <slot :field-id="fieldId" :described-by="describedBy" :error="error" />
    <p
      v-if="error"
      :id="errorId"
      class="form-field__support form-field__support--error"
      role="alert"
    >
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="form-field__support">{{ hint }}</p>
  </fieldset>

  <div
    v-else
    class="form-field"
    :class="{ 'form-field--disabled': disabled, 'form-field--invalid': Boolean(error) }"
  >
    <label v-if="label" class="form-field__label" :for="fieldId">
      {{ label }}
      <span v-if="required" class="form-field__required" aria-hidden="true">*</span>
    </label>
    <slot :field-id="fieldId" :described-by="describedBy" :error="error" />
    <p
      v-if="error"
      :id="errorId"
      class="form-field__support form-field__support--error"
      role="alert"
    >
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="form-field__support">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

type FormFieldVariant = "field" | "group";

const props = withDefaults(
  defineProps<{
    label?: string;
    id?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    variant?: FormFieldVariant;
  }>(),
  {
    label: "",
    id: undefined,
    hint: "",
    error: "",
    required: false,
    disabled: false,
    variant: "field",
  },
);

defineSlots<{
  default(props: { fieldId: string; describedBy?: string; error: string }): unknown;
}>();

const fallbackId = useId();
const fieldId = computed(() => props.id ?? `form-field-${fallbackId}`);
const hintId = computed(() => `${fieldId.value}-hint`);
const errorId = computed(() => `${fieldId.value}-error`);
const describedBy = computed(() =>
  props.error ? errorId.value : props.hint ? hintId.value : undefined,
);
</script>

<style scoped>
.form-field {
  display: grid;
  gap: var(--spacing-xs);
  color: var(--md-sys-color-on-surface);
}

.form-field--group {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.form-field__label {
  color: var(--md-sys-color-on-surface);
  font: var(--md-sys-typescale-label-large);
}

.form-field__required {
  color: var(--md-sys-color-error);
}

.form-field__support {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-body-small);
}

.form-field__support--error {
  color: var(--md-sys-color-error);
}

.form-field--disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
}

.form-field--disabled .form-field__label,
.form-field--disabled .form-field__support {
  color: inherit;
}
</style>
