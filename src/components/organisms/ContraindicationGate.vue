<template>
  <div v-if="checklistItems.length > 0" class="result-section contraindications-section">
    <h3 class="section-title">Controleer Contra-indicaties</h3>
    <div class="checklist">
      <div v-for="item in checklistItems" :key="item.key" class="checklist-item">
        <input
          :id="item.inputId"
          type="checkbox"
          class="md-checkbox"
          :checked="isChecked(item.key)"
          @change="setChecked(item.key, ($event.target as HTMLInputElement).checked)"
        />
        <label :for="item.inputId" class="checklist-label">
          {{ item.text }}
        </label>
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
    class="result-section"
    variant="info"
    role="status"
  >
    <em>Behandeling wordt getoond na controle van contra-indicaties.</em>
  </Notice>
  <p v-if="treatmentText" class="sr-only" aria-live="polite">{{ treatmentStatusMessage }}</p>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Notice from "../molecules/Notice.vue";
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
  display: flex;
  min-height: var(--min-touch-target);
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) 0;
  cursor: pointer;
}

.md-checkbox {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  margin: 0;
  accent-color: var(--md-sys-color-primary);
  cursor: pointer;
  font-size: 16px;
}

.checklist-label {
  position: relative;
  color: var(--md-sys-color-on-surface);
  font: var(--md-sys-typescale-body-medium);
  transition: color var(--motion-duration-long) var(--motion-easing-standard);
}

.checklist-label::after {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: var(--md-sys-color-on-surface-variant);
  content: "";
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--motion-duration-long) var(--motion-easing-standard);
}

.md-checkbox:checked + .checklist-label {
  color: var(--md-sys-color-on-surface-variant);
}

.md-checkbox:checked + .checklist-label::after {
  transform: scaleX(1);
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
