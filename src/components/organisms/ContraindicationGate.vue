<template>
  <div v-if="checklistItems.length > 0" class="result-section contraindications-section">
    <h3 class="section-title">Controleer Contra-indicaties</h3>
    <div class="checklist">
      <div
        v-for="item in checklistItems"
        :key="item.key"
        class="checklist-item"
        :class="{ 'checklist-item--checked': isChecked(item.key) }"
      >
        <Checkbox
          :id="item.inputId"
          :model-value="isChecked(item.key)"
          :label="item.text"
          @update:model-value="setChecked(item.key, $event)"
        />
      </div>
    </div>
  </div>

  <div
    v-if="allChecked && treatmentText"
    class="result-section treatment-section"
    aria-live="polite"
  >
    <h3 class="section-title">Behandeling</h3>
    <p>{{ treatmentText }}</p>
  </div>
  <Notice
    v-else-if="!allChecked && treatmentText"
    class="contraindication-notice"
    variant="info"
    title="Controle nodig"
    role="status"
  >
    <p>Controleer alle contra-indicaties voordat behandeling wordt getoond.</p>
  </Notice>
  <p v-if="treatmentText" class="sr-only" aria-live="polite">{{ treatmentStatusMessage }}</p>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Notice from "../molecules/Notice.vue";
import Checkbox from "../primitives/Checkbox.vue";
import type { Contraindication } from "../../types";

type ChecklistItem = Contraindication & {
  key: string;
  inputId: string;
};

const props = withDefaults(
  defineProps<{
    contraindications?: readonly Contraindication[];
    treatment?: string;
  }>(),
  {
    contraindications: () => [],
    treatment: "",
  },
);

const checkedKeys = ref<string[]>([]);

const checklistItems = computed<ChecklistItem[]>(() =>
  props.contraindications
    .filter((item) => item && typeof item.text === "string" && item.text.trim().length > 0)
    .map((item, index) => {
      const key = item.id || `contraindication-${index}`;
      return {
        ...item,
        key,
        inputId: `ci-check-${key}`,
      };
    }),
);

const treatmentText = computed(() => props.treatment.trim());

const allChecked = computed(() => {
  if (checklistItems.value.length === 0) return true;
  return checklistItems.value.every((item) => checkedKeys.value.includes(item.key));
});

const treatmentStatusMessage = computed(() => {
  if (!treatmentText.value) return "";
  return allChecked.value
    ? "Behandeling beschikbaar na controle van contra-indicaties."
    : "Behandeling verborgen tot alle contra-indicaties zijn gecontroleerd.";
});

function isChecked(key: string): boolean {
  return checkedKeys.value.includes(key);
}

function setChecked(key: string, checked: boolean): void {
  if (checked) {
    if (!checkedKeys.value.includes(key)) {
      checkedKeys.value = [...checkedKeys.value, key];
    }
    return;
  }
  checkedKeys.value = checkedKeys.value.filter((currentKey) => currentKey !== key);
}

watch(
  checklistItems,
  (items) => {
    const allowedKeys = new Set(items.map((item) => item.key));
    checkedKeys.value = checkedKeys.value.filter((key) => allowedKeys.has(key));
  },
  { immediate: true },
);
</script>

<style scoped>
.result-section {
  padding: 0;
}

.section-title {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  color: var(--md-sys-color-primary);
  font: var(--md-sys-typescale-title-medium);
}

.result-section p {
  margin: 0;
  font: var(--md-sys-typescale-body-large);
  line-height: 1.6;
}

.contraindications-section {
  background: none;
}

.checklist {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.checklist-item {
  min-height: var(--min-touch-target);
  padding: var(--spacing-xs) 0;
}

.checklist-item :deep(.checkbox-field__label) {
  transition:
    color var(--motion-duration-long) var(--motion-easing-standard),
    text-decoration-color var(--motion-duration-long) var(--motion-easing-standard);
  text-decoration: line-through;
  text-decoration-color: transparent;
}

.checklist-item--checked :deep(.checkbox-field__label) {
  color: var(--md-sys-color-on-surface-variant);
  text-decoration-color: currentColor;
}

.treatment-section {
  padding: var(--spacing-md);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-left: 3px solid var(--md-sys-color-primary);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container-low);
}

@media (max-width: 599.98px) {
  .treatment-section {
    padding: var(--spacing-sm);
  }
}
</style>
