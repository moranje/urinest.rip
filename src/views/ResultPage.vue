<template>
  <div class="result-page">
    <main class="result-main">
      <!-- Back navigation -->
      <nav class="result-nav">
        <button
          class="back-button"
          @click="goBack">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            aria-hidden="true">
            <path
              fill="currentColor"
              d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Terug
        </button>
      </nav>

      <!-- Skeleton loading -->
      <div
        v-if="isLoading"
        class="result-content"
        aria-busy="true"
        aria-label="Resultaat laden">
        <div class="result-section">
          <div
            class="skeleton-line"
            style="
              width: 80px;
              height: 24px;
              border-radius: 9999px;
              margin-bottom: 12px;
            "></div>
          <div class="skeleton-line skeleton-line--title"></div>
          <div class="skeleton-line skeleton-line--text"></div>
          <div class="skeleton-line skeleton-line--text"></div>
          <div class="skeleton-line skeleton-line--short"></div>
        </div>
        <div class="result-section">
          <div
            class="skeleton-line skeleton-line--title"
            style="width: 50%"></div>
          <div class="skeleton-line skeleton-line--text"></div>
          <div class="skeleton-line skeleton-line--short"></div>
        </div>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="error-message">
        <h2>Resultaat niet gevonden</h2>
        <p>{{ error }}</p>
      </div>

      <!-- Result content — no wrapping card, sections stand alone -->
      <div
        v-else-if="resultData"
        class="result-content">
        <!-- Title & Description -->
        <div class="result-section result-section--title">
          <span
            v-if="resultData.urgency"
            class="urgency-badge"
            :class="'urgency-badge--' + resultData.urgency.toLowerCase()">
            {{ resultData.urgency }}
          </span>
          <h2 class="result-heading">{{ resultData.title }}</h2>
          <p
            v-if="resultData.description"
            class="result-description">
            {{ resultData.description }}
          </p>
        </div>

        <!-- Additional Tests -->
        <div
          v-if="resultData.additionalTests"
          class="result-section">
          <h3 class="section-title">Aanvullend Onderzoek</h3>
          <p>{{ resultData.additionalTests }}</p>
        </div>

        <!-- Contraindications Checklist -->
        <div
          v-if="contraindicationsState.length > 0"
          class="result-section contraindications-section">
          <h3 class="section-title">Controleer Contra-indicaties</h3>
          <div class="checklist">
            <div
              v-for="(item, index) in contraindicationsState"
              :key="index"
              class="checklist-item">
              <input
                :id="'ci-check-' + index"
                v-model="item.checked"
                type="checkbox"
                class="md-checkbox" />
              <label
                :for="'ci-check-' + index"
                class="checklist-label">
                {{ item.text }}
              </label>
            </div>
          </div>
        </div>

        <!-- Treatment (conditional on contraindications) -->
        <div
          v-if="allContraindicationsChecked && resultData.treatment"
          class="result-section treatment-section">
          <h3 class="section-title">Behandeling</h3>
          <p>{{ resultData.treatment }}</p>
        </div>
        <div
          v-else-if="!allContraindicationsChecked && resultData.treatment"
          class="result-section treatment-section treatment-section--hidden">
          <p>
            <em
              >Behandeling wordt getoond na controle van contra-indicaties.</em
            >
          </p>
        </div>

        <!-- Warnings -->
        <div
          v-if="resultData.warnings"
          class="result-section warning-section">
          <h3 class="section-title">Waarschuwing</h3>
          <p>{{ resultData.warnings }}</p>
        </div>

        <!-- Test After Treatment -->
        <div
          v-if="resultData.testAfterTreatment"
          class="result-section">
          <h3 class="section-title">Vervolgonderzoek</h3>
          <p>{{ resultData.testAfterTreatment }}</p>
        </div>

        <!-- Explainer (for patient conversation) -->
        <div
          v-if="resultData.explainer"
          class="result-section explainer-section">
          <h3 class="section-title">Leg uit aan patiënt</h3>
          <p>{{ resultData.explainer }}</p>
        </div>

        <!-- Documentation (copy to clipboard for EPD) -->
        <div
          v-if="planDocumentation"
          class="result-section documentation-section">
          <h3 class="section-title">Documenteer (voor EPD)</h3>
          <div class="documentation-content">
            <pre class="documentation-text">{{ planDocumentation }}</pre>
            <button
              class="md-button md-button--outlined copy-button"
              @click="copyDocumentation">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
              {{ copyLabel }}
            </button>
          </div>
        </div>

        <!-- Sources -->
        <div
          v-if="resultData.sources && resultData.sources.length > 0"
          class="result-section">
          <h3 class="section-title">Bronnen</h3>
          <ul class="sources-list">
            <li
              v-for="(source, index) in resultData.sources"
              :key="index">
              <a
                v-if="source.url"
                :href="source.url"
                target="_blank"
                rel="noopener noreferrer"
                class="source-item source-link">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M17 13H7v-2h10m-3-8H5v14h14V8h-5V5M7 3h7l5 5v11H5V3Z" />
                </svg>
                {{ source.name }}
              </a>
              <span
                v-else
                class="source-item source-text">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M17 13H7v-2h10m-3-8H5v14h14V8h-5V5M7 3h7l5 5v11H5V3Z" />
                </svg>
                {{ source.name }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, watch, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useQuestionnaireStore } from '../store/questionnaireStore'
  import { useToastStore } from '../store/toastStore'
  import type { Contraindication, ResultData } from '../types'

  const props = defineProps<{
    resultKey: string
  }>()

  const router = useRouter()
  const toast = useToastStore()
  const resultData = ref<ResultData | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const copyLabel = ref('Kopieer')

  const contraindicationsState = reactive<Array<Contraindication & { checked: boolean }>>([])

  const allContraindicationsChecked = computed(() => {
    if (contraindicationsState.length === 0) return true
    return contraindicationsState.every((item) => item.checked)
  })

  const planDocumentation = computed(() => {
    if (!resultData.value) return ''
    return (resultData.value.documentation || '').trim()
  })

  const fetchResultData = (key: string): void => {
    isLoading.value = true
    error.value = null
    resultData.value = null
    contraindicationsState.splice(0, contraindicationsState.length)

    const store = useQuestionnaireStore()
    const foundResult = store.getResultByKey(key)

    if (foundResult) {
      resultData.value = foundResult
      if (Array.isArray(foundResult.contraindications)) {
        for (const ci of foundResult.contraindications) {
          if (ci && typeof ci.text === 'string') {
            contraindicationsState.push({ ...ci, checked: false })
          }
        }
      }
    } else {
      const availableKeys = Object.keys(store.results)
      const questionnaires = store.questionnaireList.map((q) => q.id)
      console.error(
        `[ResultPage] Resultaat "${key}" niet gevonden.\n` +
        `Doorzochte vragenlijsten: ${questionnaires.join(' → ')}\n` +
        `Beschikbare resultaten (${availableKeys.length}): ${availableKeys.join(', ')}`
      )
      error.value = `Resultaat "${key}" niet gevonden. Doorzochte vragenlijsten: ${questionnaires.join(' → ')}`
    }

    isLoading.value = false
  }

  const goBack = (): void => {
    router.back()
  }

  const copyDocumentation = async (): Promise<void> => {
    const textToCopy = planDocumentation.value
    if (!textToCopy) return
    try {
      await navigator.clipboard.writeText(textToCopy)
      toast.success('Gekopieerd naar klembord')
    } catch {
      toast.error('Kopiëren mislukt')
    }
  }

  onMounted(async () => {
    const store = useQuestionnaireStore()
    if (!store.dataReady) {
      try {
        await store.loadInitialData()
      } catch {
        error.value = 'Kon vragenlijstgegevens niet laden'
        return
      }
    }
    fetchResultData(props.resultKey)
  })

  watch(
    () => props.resultKey,
    async (newKey, oldKey) => {
      if (newKey !== oldKey) {
        const store = useQuestionnaireStore()
        if (!store.dataReady) {
          try {
            await store.loadInitialData()
          } catch {
            error.value = 'Kon vragenlijstgegevens niet laden'
            return
          }
        }
        fetchResultData(newKey)
      }
    },
  )
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
    transition: background-color var(--motion-duration-short)
      var(--motion-easing-standard);
  }

  .back-button:hover {
    background-color: color-mix(
      in srgb,
      var(--md-sys-color-primary) 8%,
      transparent
    );
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

  /* Title section */
  .result-section--title {
    padding: 0;
    background: none;
  }

  .section-title {
    font: var(--md-sys-typescale-title-medium);
    color: var(--md-sys-color-primary);
    margin-top: 0;
    margin-bottom: var(--spacing-sm);
  }

  /* Urgency badge */
  .urgency-badge {
    display: inline-block;
    font: var(--md-sys-typescale-label-large);
    font-weight: 700;
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--md-sys-shape-corner-full);
    margin-bottom: var(--spacing-sm);
    color: white;
  }
  .urgency-badge--u2 {
    background-color: var(--md-sys-color-error);
  }
  .urgency-badge--u3 {
    background-color: var(--md-sys-color-warning);
  }

  .result-heading {
    font: var(--md-sys-typescale-headline-small);
    color: var(--md-sys-color-on-surface);
    margin-top: 0;
    margin-bottom: var(--spacing-sm);
  }

  .result-description {
    color: var(--md-sys-color-on-surface-variant);
    font: var(--md-sys-typescale-body-large);
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
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
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    height: 1px;
    width: 100%;
    background-color: var(--md-sys-color-on-surface-variant);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform var(--motion-duration-long)
      var(--motion-easing-standard);
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

  .treatment-section--hidden {
    background: none;
    border: none;
    border-left: 3px solid var(--md-sys-color-outline-variant);
  }
  .treatment-section--hidden p {
    color: var(--md-sys-color-on-surface-variant);
  }

  /* Warning section — colored banner */
  .warning-section {
    background-color: var(--md-sys-color-warning-container);
    border-left: 3px solid var(--md-sys-color-warning);
    padding: var(--spacing-md);
    border-radius: var(--md-sys-shape-corner-medium);
  }
  .warning-section .section-title {
    color: var(--md-sys-color-on-warning-container);
    border-bottom-color: var(--md-sys-color-warning);
  }
  .warning-section p {
    color: var(--md-sys-color-on-warning-container);
  }

  /* Explainer section — soft background */
  .explainer-section {
    background-color: var(--md-sys-color-surface-container);
    padding: var(--spacing-md);
    border-radius: var(--md-sys-shape-corner-medium);
  }
  .explainer-section p {
    font: var(--md-sys-typescale-body-medium);
    line-height: 1.6;
    white-space: pre-wrap;
  }

  /* Documentation */
  .documentation-content {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    background-color: var(--md-sys-color-surface-container);
    padding: var(--spacing-md);
    border-radius: var(--md-sys-shape-corner-small);
    border: 1px solid var(--md-sys-color-outline-variant);
  }

  .documentation-text {
    font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
    font-size: 13px;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    flex-grow: 1;
  }

  .copy-button {
    flex-shrink: 0;
    min-height: var(--min-touch-target);
    padding: 0 var(--spacing-md);
    font: var(--md-sys-typescale-label-large);
  }
  .copy-button svg {
    margin-right: var(--spacing-xs);
  }

  /* Sources */
  .sources-list {
    list-style: none;
    padding-left: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .source-item {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    font: var(--md-sys-typescale-label-small);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--md-sys-shape-corner-full);
    border: 1px solid var(--md-sys-color-outline);
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface-variant);
    transition:
      background-color var(--motion-duration-medium)
        var(--motion-easing-standard),
      border-color var(--motion-duration-medium) var(--motion-easing-standard);
  }
  .source-item svg {
    flex-shrink: 0;
  }

  .source-link {
    color: var(--md-sys-color-primary);
    text-decoration: none;
    border-color: var(--md-sys-color-primary);
    background-color: transparent;
  }

  .source-link:hover {
    background-color: color-mix(
      in srgb,
      var(--md-sys-color-primary) 8%,
      transparent
    );
  }

  .source-text {
    color: var(--md-sys-color-on-surface-variant);
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
    animation: skeleton-shimmer var(--motion-duration-long) ease-in-out infinite
      alternate;
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
    animation: fadeInUp var(--motion-duration-enter) var(--motion-easing-out)
      forwards;
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

  /* Mobile */
  @media (max-width: 599px) {
    .result-main {
      padding: var(--spacing-sm);
    }
    .result-content {
      gap: var(--spacing-sm);
    }
    .result-heading {
      font: var(--md-sys-typescale-title-large);
    }
    .treatment-section,
    .warning-section,
    .explainer-section {
      padding: var(--spacing-sm);
    }
    .documentation-content {
      flex-direction: column;
      padding: var(--spacing-sm);
      gap: var(--spacing-sm);
    }
    .copy-button {
      width: 100%;
    }
  }
</style>
