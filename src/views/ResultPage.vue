<template>
  <div class="result-page">
    <section class="result-main" aria-label="Resultaat">
      <!-- Back navigation -->
      <nav class="result-nav" aria-label="Resultaat navigatie">
        <BackButton @click="goBack">Terug</BackButton>
      </nav>

      <!-- Skeleton loading -->
      <div v-if="isLoading" class="result-content" aria-busy="true" aria-label="Resultaat laden">
        <div class="result-section">
          <Skeleton variant="badge" />
          <Skeleton variant="title" />
          <Skeleton variant="line" />
          <Skeleton variant="line" />
          <Skeleton variant="short" />
        </div>
        <div class="result-section">
          <Skeleton variant="title" width="50%" />
          <Skeleton variant="line" />
          <Skeleton variant="short" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-message">
        <h1>Resultaat niet gevonden</h1>
        <p>{{ error }}</p>
      </div>

      <!-- Result content — no wrapping card, sections stand alone -->
      <div v-else-if="resultData" class="result-content">
        <ResultSectionList :result="resultData">
          <template #after-additional>
            <!-- Contraindications Checklist -->
            <div
              v-if="contraindicationsState.length > 0"
              class="result-section contraindications-section"
            >
              <h3 class="section-title">Controleer Contra-indicaties</h3>
              <div class="checklist">
                <div
                  v-for="(item, index) in contraindicationsState"
                  :key="index"
                  class="checklist-item"
                >
                  <input
                    :id="'ci-check-' + index"
                    v-model="item.checked"
                    type="checkbox"
                    class="md-checkbox"
                  />
                  <label :for="'ci-check-' + index" class="checklist-label">
                    {{ item.text }}
                  </label>
                </div>
              </div>
            </div>

            <!-- Treatment (conditional on contraindications) -->
            <div
              v-if="allContraindicationsChecked && resultData.treatment"
              class="result-section treatment-section"
              aria-live="polite"
            >
              <h3 class="section-title">Behandeling</h3>
              <p>{{ resultData.treatment }}</p>
            </div>
            <Notice
              v-else-if="!allContraindicationsChecked && resultData.treatment"
              class="result-section"
              variant="info"
              role="status"
            >
              <em>Behandeling wordt getoond na controle van contra-indicaties.</em>
            </Notice>
            <p class="sr-only" aria-live="polite">{{ treatmentStatusMessage }}</p>
          </template>

          <DocumentationCopyPanel
            :text="planDocumentation"
            @copied="handleDocumentationCopied"
            @error="handleDocumentationCopyError"
          />
        </ResultSectionList>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { handleError } from "../lib/errors";
import { useQuestionnaireStore } from "../store/questionnaireStore";
import { useToastStore } from "../store/toastStore";
import BackButton from "../components/primitives/BackButton.vue";
import Notice from "../components/molecules/Notice.vue";
import DocumentationCopyPanel from "../components/organisms/DocumentationCopyPanel.vue";
import ResultSectionList from "../components/organisms/ResultSectionList.vue";
import Skeleton from "../components/primitives/Skeleton.vue";
import type { Contraindication, ResultData } from "../types";

const props = defineProps<{
  resultKey: string;
}>();

const router = useRouter();
const toast = useToastStore();
const resultData = ref<ResultData | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const treatmentStatusMessage = ref("");

const contraindicationsState = reactive<Array<Contraindication & { checked: boolean }>>([]);

const allContraindicationsChecked = computed(() => {
  if (contraindicationsState.length === 0) return true;
  return contraindicationsState.every((item) => item.checked);
});

const planDocumentation = computed(() => {
  if (!resultData.value) return "";
  return (resultData.value.documentation || "").trim();
});

watch(allContraindicationsChecked, (isChecked) => {
  if (!resultData.value?.treatment) return;
  treatmentStatusMessage.value = isChecked
    ? "Behandeling beschikbaar na controle van contra-indicaties."
    : "Behandeling verborgen tot alle contra-indicaties zijn gecontroleerd.";
});

const fetchResultData = (key: string): void => {
  isLoading.value = true;
  error.value = null;
  resultData.value = null;
  contraindicationsState.splice(0, contraindicationsState.length);

  const store = useQuestionnaireStore();
  const foundResult = store.getResultByKey(key);

  if (foundResult) {
    resultData.value = foundResult;
    if (Array.isArray(foundResult.contraindications)) {
      for (const ci of foundResult.contraindications) {
        if (ci && typeof ci.text === "string") {
          contraindicationsState.push({ ...ci, checked: false });
        }
      }
    }
  } else {
    const availableKeys = Object.keys(store.results);
    const questionnaires = store.questionnaireList.map((q) => q.id);
    handleError(new Error(`Result key not found: ${key}`), "result-page:key-not-found", {
      resultKey: key,
      availableKeys,
      questionnaires,
    });
    error.value = `Resultaat "${key}" niet gevonden. Doorzochte vragenlijsten: ${questionnaires.join(" → ")}`;
  }

  isLoading.value = false;
};

const goBack = (): void => {
  if (window.history.state.back) {
    router.back();
  } else {
    router.push("/");
  }
};

const handleDocumentationCopied = (): void => {
  navigator.vibrate?.(10);
  toast.success("Gekopieerd naar klembord");
};

const handleDocumentationCopyError = (copyError: unknown): void => {
  handleError(copyError, "result-page:copy-documentation", { resultKey: props.resultKey });
  toast.error("Kopiëren mislukt");
};

onMounted(async () => {
  const store = useQuestionnaireStore();
  if (!store.dataReady) {
    try {
      await store.loadInitialData();
    } catch (loadError) {
      handleError(loadError, "result-page:load-data", { resultKey: props.resultKey });
      error.value = "Kon vragenlijstgegevens niet laden";
      return;
    }
  }
  fetchResultData(props.resultKey);
});

watch(
  () => props.resultKey,
  async (newKey, oldKey) => {
    if (newKey !== oldKey) {
      const store = useQuestionnaireStore();
      if (!store.dataReady) {
        try {
          await store.loadInitialData();
        } catch (loadError) {
          handleError(loadError, "result-page:load-data", { resultKey: newKey });
          error.value = "Kon vragenlijstgegevens niet laden";
          return;
        }
      }
      fetchResultData(newKey);
    }
  },
);
</script>

<style scoped>
.result-page {
  display: flex;
  flex-direction: column;
}

.result-main {
  flex: 1;
  padding: var(--spacing-lg) var(--spacing-md);
  max-width: var(--layout-content-max-width);
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  contain: layout style paint;
  container-type: inline-size;
  container-name: result-main;
}

/* Back navigation */
.result-nav {
  width: 100%;
  padding: 0 0 var(--spacing-sm);
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: transparent;
  color: var(--md-sys-color-primary);
  font: var(--md-sys-typescale-label-large);
  cursor: pointer;
  border-radius: var(--md-sys-shape-corner-small);
  min-height: var(--min-touch-target);
  transition: background-color var(--motion-duration-short) var(--motion-easing-standard);
}

.back-button:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}

/* Content — sections stand alone, no card wrapper */
.result-content {
  max-width: 100%;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* Base section — clean text on page bg, no card */
.result-section {
  padding: 0;
}

.section-title {
  font: var(--md-sys-typescale-title-medium);
  color: var(--md-sys-color-primary);
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
}

.result-section p {
  margin: 0;
  font: var(--md-sys-typescale-body-large);
  line-height: 1.6;
}

/* Contraindications — clean, no card */
.contraindications-section {
  padding: 0;
  background: none;
}

.checklist {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  cursor: pointer;
  min-height: var(--min-touch-target);
  padding: var(--spacing-xs) 0;
}

.md-checkbox {
  width: 22px;
  height: 22px;
  accent-color: var(--md-sys-color-primary);
  margin: 0;
  flex-shrink: 0;
  cursor: pointer;
  font-size: 16px;
}

.checklist-label {
  font: var(--md-sys-typescale-body-medium);
  color: var(--md-sys-color-on-surface);
  position: relative;
  transition: color var(--motion-duration-long) var(--motion-easing-standard);
}

.checklist-label::after {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  height: 1px;
  width: 100%;
  background-color: var(--md-sys-color-on-surface-variant);
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

/* Treatment — card with left accent border */
.treatment-section {
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-left: 3px solid var(--md-sys-color-primary);
  padding: var(--spacing-md);
  border-radius: var(--md-sys-shape-corner-medium);
}

.error-message {
  width: 100%;
  text-align: center;
  padding: var(--spacing-xl);
}

/* Skeleton loading */
.skeleton-line {
  height: 14px;
  background: var(--md-sys-color-surface-container-high);
  border-radius: var(--md-sys-shape-corner-extra-small);
  animation: skeleton-shimmer var(--motion-duration-long) ease-in-out infinite alternate;
}
.skeleton-line--title {
  height: 24px;
  width: 70%;
  margin-bottom: var(--spacing-md);
}
.skeleton-line--text {
  width: 100%;
  margin-bottom: var(--spacing-sm);
}
.skeleton-line--short {
  width: 40%;
}

/* Staggered entrance */
.result-content > * {
  opacity: 0;
  animation: fadeInUp var(--motion-duration-enter) var(--motion-easing-out) forwards;
}
.result-content > *:nth-child(1) {
  animation-delay: 30ms;
}
.result-content > *:nth-child(2) {
  animation-delay: 60ms;
}
.result-content > *:nth-child(3) {
  animation-delay: 90ms;
}
.result-content > *:nth-child(4) {
  animation-delay: 120ms;
}
.result-content > *:nth-child(5) {
  animation-delay: 150ms;
}
.result-content > *:nth-child(6) {
  animation-delay: 180ms;
}
.result-content > *:nth-child(7) {
  animation-delay: 210ms;
}
.result-content > *:nth-child(8) {
  animation-delay: 240ms;
}

/* Mobile — bp-md: 600px */
@media (max-width: 599.98px) {
  .result-main {
    padding: var(--spacing-sm);
  }
  .result-content {
    gap: var(--spacing-sm);
  }
  .treatment-section {
    padding: var(--spacing-sm);
  }
}
</style>
