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
  display: grid;
  grid-template-columns: var(--min-touch-target) 1fr;
  align-items: start;
  gap: var(--spacing-sm);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
}

.checkbox-field__control {
  width: 22px;
  height: 22px;
  margin: calc((var(--min-touch-target) - 22px) / 2);
  accent-color: var(--md-sys-color-primary);
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

.checkbox-field--disabled .checkbox-field__description {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
}
</style>
