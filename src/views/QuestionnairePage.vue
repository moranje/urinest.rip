<template>
  <div class="questionnaire-page">
    <main class="page-content">
      <div v-if="isLoading" class="md-card question-card" aria-busy="true" aria-label="Vragenlijst laden">
        <div class="question-header">
          <div class="skeleton-line skeleton-line--title"></div>
          <div class="skeleton-line skeleton-line--short"></div>
        </div>
        <div class="question-options">
          <div class="skeleton-option"></div>
          <div class="skeleton-option"></div>
          <div class="skeleton-option"></div>
        </div>
      </div>
      <Transition v-else name="question-fade" mode="out-in">
        <div
          v-if="currentQuestion"
          :key="currentQuestion.id"
          class="md-card question-card"
        >
          <button
            v-if="questionHistory.length > 0"
            class="back-button"
            @click="goToPreviousQuestion"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Terug
          </button>
          <div class="question-header">
            <h2 class="question-title">
              {{ currentQuestion.text }}
            </h2>
            <p v-if="currentStep?.description" class="question-step">
              {{ currentStep.description }}
            </p>
          </div>

          <div class="question-options">
            <div
              v-for="(option, index) in currentQuestion.options"
              :key="option.id"
              class="option-item"
              :class="{ 'option-selected': isOptionSelected(option) }"
              role="button"
              tabindex="0"
              @click="isMultiSelect ? toggleOption(option) : selectOption(option)"
              @keydown.enter="isMultiSelect ? toggleOption(option) : selectOption(option)"
            >
              <div class="option-content">
                <span v-if="isNonTouchDevice" class="option-prefix">{{ String.fromCharCode(65 + index) }}.</span>
                <span class="option-text">{{ option.text }}</span>
              </div>
              <div v-if="option.description" class="option-info-wrapper" @click.stop>
                <button
                  class="info-icon"
                  aria-label="Meer informatie"
                  @mouseenter.stop="showPopover(option, $event)"
                  @mouseleave.stop="hidePopover"
                  @focus.stop="showPopover(option, $event)"
                  @blur.stop="hidePopover"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              v-if="isMultiSelect"
              class="md-button md-button--primary confirm-button"
              :disabled="!hasSelectedOptions"
              @click="confirmMultipleChoice"
            >
              Bevestigen
            </button>
          </div>

          <div
            v-if="currentQuestion.description"
            class="question-description"
            v-html="compiledMarkdown(currentQuestion.description)"
          />
        </div>
        <div v-else-if="!isLoading && !currentQuestion">
          <div class="loading-message">
            <div class="loading-spinner" />
            Resultaat bepalen...
          </div>
        </div>
      </Transition>
    </main>

    <teleport to="body">
      <div
        v-if="activePopoverOptionId"
        class="info-popover md-card"
        :style="popoverStyle"
        role="tooltip"
      >
        <div v-html="compiledMarkdown(popoverDescription)" />
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { marked } from 'marked'
import { useRouter } from 'vue-router'
import { useQuestionnaireStore } from '../store/questionnaireStore'
import type { QuestionOption, Question, Step, AnswerValue, PopoverStyle } from '../types'

const router = useRouter()
const questionnaireStore = useQuestionnaireStore()

const props = defineProps<{
  id: string
}>()

const isLoading = ref(true)
const currentQuestionId = ref<string | null>(null)
const isNonTouchDevice = ref(false)
const isNavigating = ref(false)
const questionHistory = ref<string[]>([])

// Popover State
const activePopoverOptionId = ref<string | null>(null)
const popoverDescription = ref('')
const popoverStyle = ref<PopoverStyle>({ top: '0px', left: '0px', visibility: 'hidden' })
let hidePopoverTimeout: ReturnType<typeof setTimeout> | null = null

// --- Computed Properties ---

const isMultiSelect = computed(() => {
  const t = currentQuestion.value?.type
  return t === 'multiple' || t === 'multi_select'
})

const questionnaire = computed(() => questionnaireStore.getQuestionnaireById(props.id))

const currentQuestion = computed((): Question | null | undefined => {
  if (!currentQuestionId.value) return null
  return questionnaireStore.getQuestionById(currentQuestionId.value) ?? null
})

const currentStep = computed((): Step | null | undefined => {
  if (!currentQuestionId.value || !questionnaire.value) return null
  const stepId = questionnaire.value.stepIds.find((sid: string) => {
    const step = questionnaireStore.getStepById(sid)
    return step?.questionIds.includes(currentQuestionId.value!)
  })
  return stepId ? questionnaireStore.getStepById(stepId) ?? null : null
})

const hasSelectedOptions = computed(() => {
  if (!currentQuestion.value) return false
  const answer = questionnaireStore.getAnswer(props.id, currentQuestion.value.id)
  if (answer === undefined || answer === null) return false
  if (isMultiSelect.value) {
    return Array.isArray(answer) && answer.length > 0
  }
  return true
})

// --- Lifecycle Hooks ---

onMounted(async () => {
  if (!questionnaireStore.dataReady) {
    try {
      await questionnaireStore.loadInitialData()
    } catch (err) {
      console.error('Error loading questionnaire data', err)
      isLoading.value = false
      router.replace('/error')
      return
    }
  }
  await loadStateAndDetermineStart()
  checkNonTouch()
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// --- Core Logic ---

const loadStateAndDetermineStart = async (): Promise<void> => {
  isLoading.value = true
  if (!questionnaire.value) {
    router.replace('/')
    return
  }

  questionnaireStore.clearAnswers(props.id)
  questionHistory.value = []
  currentQuestionId.value = findNextQuestionId(null)

  isLoading.value = false
}

const findNextQuestionId = (startQuestionId: string | null = null): string | null => {
  const qData = questionnaire.value
  if (!qData || !qData.stepIds) return null

  let searching = !startQuestionId

  for (const stepId of qData.stepIds) {
    const step = questionnaireStore.getStepById(stepId)
    if (!step || !step.questionIds) continue

    for (const questionId of step.questionIds) {
      if (searching) {
        const questionDef = questionnaireStore.getQuestionById(questionId)
        if (questionDef) {
          const { isValid } = questionnaireStore.validateConditions(
            props.id,
            questionDef.conditions || []
          )
          if (isValid) {
            return questionId
          }
        }
      } else if (questionId === startQuestionId) {
        searching = true
      }
    }
  }
  return null
}

const goToNextQuestion = (): void => {
  if (currentQuestionId.value) {
    questionHistory.value.push(currentQuestionId.value)
  }
  const nextId = findNextQuestionId(currentQuestionId.value)
  if (nextId) {
    currentQuestionId.value = nextId
  } else {
    currentQuestionId.value = null
    determineResult()
  }
}

const goToPreviousQuestion = (): void => {
  if (questionHistory.value.length === 0) return
  currentQuestionId.value = questionHistory.value.pop() ?? null
}

const determineResult = (): void => {
  if (isNavigating.value) return
  isNavigating.value = true

  const fullQuestionnaire = questionnaireStore.getFullQuestionnaire(props.id)
  if (!fullQuestionnaire) {
    router.replace('/error')
    return
  }

  const answers = questionnaireStore.getAllAnswersForQuestionnaire(props.id)
  const { outcome } = questionnaireStore.determineOutcomeForPath(
    props.id,
    answers,
    fullQuestionnaire.resultsLogic
  )

  if (outcome) {
    const [type, value] = outcome.split(':')
    if (type === 'redirect') {
      questionnaireStore.clearAnswers(props.id)
      router.replace(`/questionnaire/${value}`)
    } else {
      router.push(`/info/${value}`)
    }
  } else {
    router.push('/error')
  }
}

// --- Answer & Interaction Handlers ---

const selectOption = (option: QuestionOption): void => {
  if (!currentQuestion.value) return
  questionnaireStore.setAnswer(props.id, currentQuestion.value.id, {
    value: option.value,
    text: option.text
  })
  goToNextQuestion()
}

const toggleOption = (option: QuestionOption): void => {
  if (!currentQuestion.value) return
  const currentAnswer = questionnaireStore.getAnswer(props.id, currentQuestion.value.id)
  const answerArray = (Array.isArray(currentAnswer) ? currentAnswer : []) as AnswerValue[]
  const newAnswer = [...answerArray]
  const existingIndex = newAnswer.findIndex((a) => a.value === option.value)

  if (existingIndex >= 0) {
    newAnswer.splice(existingIndex, 1)
  } else {
    newAnswer.push({ value: option.value, text: option.text })
  }
  questionnaireStore.setAnswer(props.id, currentQuestion.value.id, newAnswer)
}

const confirmMultipleChoice = (): void => {
  goToNextQuestion()
}

const isOptionSelected = (option: QuestionOption): boolean => {
  if (!currentQuestion.value) return false
  const answer = questionnaireStore.getAnswer(props.id, currentQuestion.value.id)
  if (answer === undefined) return false
  if (Array.isArray(answer)) {
    return answer.some((a) => a.value === option.value)
  }
  return (answer as AnswerValue).value === option.value
}

// --- Utilities & UI ---

const handleKeyDown = (e: KeyboardEvent): void => {
  if (!currentQuestion.value?.options || isLoading.value) return
  const key = e.key.toUpperCase()
  if (key.length === 1 && key >= 'A' && key <= 'Z') {
    const index = key.charCodeAt(0) - 65
    if (index < currentQuestion.value.options.length) {
      const option = currentQuestion.value.options[index]
      if (isMultiSelect.value) {
        toggleOption(option)
      } else {
        selectOption(option)
      }
    }
  }
}

const checkNonTouch = (): void => {
  isNonTouchDevice.value =
    window.matchMedia('(pointer: fine)').matches || navigator.maxTouchPoints === 0
}

const compiledMarkdown = (text: string | undefined): string => (text ? marked.parse(text) as string : '')

const showPopover = (option: QuestionOption, event: MouseEvent | FocusEvent): void => {
  if (hidePopoverTimeout) clearTimeout(hidePopoverTimeout)
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  activePopoverOptionId.value = option.id
  popoverDescription.value = option.description || ''

  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const margin = 16
  const availableWidth = windowWidth - margin * 2
  const popoverWidth = Math.min(300, availableWidth)
  const popoverMaxHeight = 300
  const gap = 5

  const spaceBelow = windowHeight - rect.bottom - gap
  const spaceAbove = rect.top - gap
  const fitsBelow = spaceBelow >= Math.min(popoverMaxHeight, 120)

  const style: PopoverStyle = {
    position: 'fixed',
    visibility: 'visible',
    opacity: 1,
    maxWidth: `${popoverWidth}px`
  }

  if (fitsBelow) {
    style.top = `${rect.bottom + gap}px`
  } else {
    style.top = `${Math.max(margin, rect.top - gap - Math.min(popoverMaxHeight, spaceAbove))}px`
  }

  // Center on icon, then clamp to viewport
  const iconCenter = rect.left + rect.width / 2
  let left = iconCenter - popoverWidth / 2
  if (left + popoverWidth > windowWidth - margin) {
    left = windowWidth - margin - popoverWidth
  }
  if (left < margin) {
    left = margin
  }
  style.left = `${left}px`

  popoverStyle.value = style
}

const hidePopover = (): void => {
  hidePopoverTimeout = setTimeout(() => {
    activePopoverOptionId.value = null
    popoverStyle.value.visibility = 'hidden'
    popoverStyle.value.opacity = 0
  }, 100)
}

// When questionnaire id changes (redirect between flows), reinitialize
watch(() => props.id, async () => {
  isNavigating.value = false
  questionHistory.value = []
  await loadStateAndDetermineStart()
})

// Watch for the question becoming null (due to condition changes) and advance
watch(currentQuestion, (newQ, oldQ) => {
  if (newQ === null && oldQ !== null && !isLoading.value && !isNavigating.value) {
    nextTick(goToNextQuestion)
  }
})
</script>

<style scoped>
.questionnaire-page {
  display: flex;
  flex-direction: column;
}

.page-content {
  flex: 1;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  max-width: var(--layout-content-max-width);
  margin: 0 auto;
  width: 100%;
}

.question-card {
  border-radius: var(--md-sys-shape-corner-large);
  padding: var(--spacing-lg);
  box-shadow: var(--md-sys-elevation-1);
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: var(--spacing-md);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  border: none;
  background: transparent;
  color: var(--md-sys-color-primary);
  font: var(--md-sys-typescale-label-large);
  cursor: pointer;
  border-radius: var(--md-sys-shape-corner-small);
  min-height: var(--min-touch-target);
  transition: background-color var(--motion-duration-medium) var(--motion-easing-standard);
}
.back-button:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}
.back-button:active {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
}

.question-header {
  margin-bottom: var(--spacing-xl);
}

.question-title {
  font: var(--md-sys-typescale-headline-small);
  color: var(--md-sys-color-on-surface);
  margin: 0 0 var(--spacing-sm) 0;
}

.question-step {
  font: var(--md-sys-typescale-body-small);
  color: var(--md-sys-color-on-surface-variant);
  margin: 0;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex: 1;
}

.option-item {
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: var(--spacing-md);
  min-height: 56px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  touch-action: manipulation;
  transition:
    background-color var(--motion-duration-medium) var(--motion-easing-standard),
    border-color var(--motion-duration-medium) var(--motion-easing-standard),
    box-shadow var(--motion-duration-medium) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard);
  position: relative;
  overflow: hidden;
  text-align: left;
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);
}

.option-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--md-sys-color-primary);
  opacity: 0;
  transition: opacity var(--motion-duration-medium) var(--motion-easing-standard);
  pointer-events: none;
}

.option-item:hover {
  box-shadow: inset 3px 0 0 var(--md-sys-color-primary);
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 4%, var(--md-sys-color-surface-container-lowest));
}
.option-item:active::before {
  opacity: var(--md-sys-state-pressed-state-layer-opacity);
  transition-duration: var(--motion-duration-press);
}

.option-selected {
  border-color: var(--md-sys-color-primary);
  box-shadow: inset 3px 0 0 var(--md-sys-color-primary);
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, var(--md-sys-color-surface-container-lowest));
  color: var(--md-sys-color-primary);
}
.option-selected .option-prefix {
  color: var(--md-sys-color-on-primary);
  background-color: var(--md-sys-color-primary);
}

.option-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
}

.option-prefix {
  font-weight: 500;
  color: var(--md-sys-color-primary);
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
  border-radius: 50%;
  min-width: 1.75em;
  height: 1.75em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9em;
  line-height: 1;
}

.option-text {
  font: var(--md-sys-typescale-body-large);
  line-height: 1.4;
  flex-grow: 1;
}

.option-info-wrapper {
  margin-left: var(--spacing-sm);
  flex-shrink: 0;
}

.info-icon {
  background: none;
  border: none;
  padding: 13px;
  margin: -13px;
  border-radius: 50%;
  cursor: help;
  color: var(--md-sys-color-on-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
  transition: background-color var(--motion-duration-medium) var(--motion-easing-standard);
}
.info-icon svg {
  width: 18px;
  height: 18px;
}
.option-info-wrapper:hover .info-icon {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 8%, transparent);
}

.info-popover {
  width: max-content;
  max-width: 300px;
  padding: var(--spacing-md);
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-3);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity var(--motion-duration-medium) var(--motion-easing-standard);
  font: var(--md-sys-typescale-body-small);
  text-align: left;
  color: var(--md-sys-color-on-surface);
  background-color: var(--md-sys-color-surface);
  overflow-y: auto;
  max-height: 300px;
}

.question-description {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--md-sys-color-outline-variant);
  font: var(--md-sys-typescale-body-medium);
  color: var(--md-sys-color-on-surface-variant);
}

.confirm-button {
  margin-top: var(--spacing-lg);
  width: 100%;
  min-height: 56px;
}

/* Animations */
.question-fade-enter-active {
  transition:
    opacity var(--motion-duration-enter) var(--motion-easing-out),
    transform var(--motion-duration-enter) var(--motion-easing-out);
}
.question-fade-leave-active {
  transition:
    opacity var(--motion-duration-exit) var(--motion-easing-standard),
    transform var(--motion-duration-exit) var(--motion-easing-standard);
}
.question-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.question-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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
.skeleton-line--short {
  width: 40%;
}
.skeleton-option {
  height: 56px;
  background: var(--md-sys-color-surface-container-high);
  border-radius: var(--md-sys-shape-corner-small);
  animation: skeleton-shimmer var(--motion-duration-long) ease-in-out infinite alternate;
}
.skeleton-option:nth-child(2) { animation-delay: 100ms; }
.skeleton-option:nth-child(3) { animation-delay: 200ms; }

/* Mobile Adjustments */
@media (max-width: 599px) {
  .page-content {
    padding: var(--spacing-sm);
  }
  .question-card {
    padding: var(--spacing-md);
    margin: var(--spacing-sm) 0;
  }
  .question-header {
    margin-bottom: var(--spacing-lg);
  }
  .question-options {
    gap: var(--spacing-sm);
  }
  .option-item {
    padding: var(--spacing-sm) var(--spacing-md);
    min-height: 56px;
  }
  .option-prefix {
    min-width: 1.6em;
    height: 1.6em;
    font-size: 0.85em;
  }
}

/* Tablet and Desktop */
@media (min-width: 600px) {
  .page-content {
    padding: var(--spacing-md) 0;
  }
  .question-card {
    padding: var(--spacing-xl);
    margin: var(--spacing-lg) auto;
  }
  .question-title {
    font: var(--md-sys-typescale-headline-medium);
  }
}

@media (min-width: 900px) {
  .page-content {
    padding: var(--spacing-md);
  }
  .question-card {
    max-width: var(--layout-content-max-width);
    margin: var(--spacing-xl) auto;
  }
}
</style>
