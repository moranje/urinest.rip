import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  validateConditions as validateConditionsEngine,
  determineOutcome
} from 'decision-engine-core'
import { useRoleStore } from './roleStore'
import type {
  QuestionnaireMeta,
  Question,
  Step,
  ResultLogicRule,
  ResultData,
  FullQuestionnaire,
  Answer,
  AnswerMap,
  Condition,
  ValidationResult,
  OutcomeResult
} from '../types'

interface RawQuestionnaire {
  id: string
  name: string
  title: string
  description?: string
  icon?: string
  questions?: Question[]
  steps?: Step[]
  results?: Record<string, ResultData>
  resultsLogic?: Array<ResultLogicRule & { id?: string }>
}

interface FetchedData {
  questionnaires?: RawQuestionnaire[]
}

export const useQuestionnaireStore = defineStore('questionnaire', () => {
  // == NORMALIZED STATE ==
  const questionnaires = ref<Record<string, QuestionnaireMeta>>({})
  const questions = ref<Record<string, Question>>({})
  const steps = ref<Record<string, Step>>({})
  const results = ref<Record<string, ResultData>>({})
  const resultsLogic = ref<Record<string, ResultLogicRule>>({})
  const answers = ref<Record<string, AnswerMap>>({})

  const isLoading = ref(false)
  const dataReady = ref(false)
  let loadingPromise: Promise<void> | null = null

  // --- Getters ---
  const getQuestionnaireById = (id: string): QuestionnaireMeta | undefined => questionnaires.value[id]
  const getQuestionById = (id: string): Question | undefined => questions.value[id]
  const getStepById = (id: string): Step | undefined => steps.value[id]
  const getResultByKey = (key: string): ResultData | undefined => results.value[key]
  const getResultLogicById = (id: string): ResultLogicRule | undefined => resultsLogic.value[id]

  const questionnaireList = computed(() => Object.values(questionnaires.value))

  const getFullQuestionnaire = (questionnaireId: string): FullQuestionnaire | null => {
    const meta = getQuestionnaireById(questionnaireId)
    if (!meta) return null

    return {
      ...meta,
      questions: meta.questionIds.map((id) => getQuestionById(id)!).filter(Boolean),
      steps: meta.stepIds.map((id) => getStepById(id)!).filter(Boolean),
      resultsLogic: meta.resultsLogicIds.map((id) => getResultLogicById(id)!).filter(Boolean)
    }
  }

  // --- Data Loading ---
  const processFetchedData = (data: FetchedData): void => {
    if (!data?.questionnaires) return

    const newQuestionnaires: Record<string, QuestionnaireMeta> = {}
    const newQuestions: Record<string, Question> = {}
    const newSteps: Record<string, Step> = {}
    const newResults: Record<string, ResultData> = {}
    const newResultsLogic: Record<string, ResultLogicRule> = {}
    const newAnswers: Record<string, AnswerMap> = {}

    for (const q of data.questionnaires) {
      if (q.questions) {
        for (const question of q.questions) {
          newQuestions[question.id] = question
        }
      }

      if (q.steps) {
        for (const step of q.steps) {
          newSteps[step.id] = step
        }
      }

      if (q.results) {
        for (const [key, result] of Object.entries(q.results)) {
          newResults[key] = result
        }
      }

      const ruleIds: string[] = []
      if (q.resultsLogic) {
        q.resultsLogic.forEach((rule, index) => {
          const ruleId = rule.id || `${q.id}-rule-${index}`
          newResultsLogic[ruleId] = { ...rule, id: ruleId }
          ruleIds.push(ruleId)
        })
      }

      newQuestionnaires[q.id] = {
        id: q.id,
        name: q.name,
        title: q.title,
        description: q.description,
        icon: q.icon,
        questionIds: q.questions ? q.questions.map((item) => item.id) : [],
        stepIds: q.steps ? q.steps.map((item) => item.id) : [],
        resultsLogicIds: ruleIds
      }

      newAnswers[q.id] = {}
    }

    questionnaires.value = newQuestionnaires
    questions.value = newQuestions
    steps.value = newSteps
    results.value = newResults
    resultsLogic.value = newResultsLogic
    answers.value = newAnswers
    dataReady.value = true
  }

  const loadInitialData = async (): Promise<void> => {
    if (isLoading.value && loadingPromise) {
      return loadingPromise
    }
    isLoading.value = true
    dataReady.value = false

    loadingPromise = (async () => {
      try {
        const response = await fetch('/main.json?t=' + Date.now())
        if (!response.ok) {
          throw new Error(`Failed to fetch main.json: ${response.statusText}`)
        }
        const data: FetchedData = await response.json()
        processFetchedData(data)
      } catch (error) {
        console.error('Failed to load initial data', error)
        throw error
      } finally {
        isLoading.value = false
        loadingPromise = null
      }
    })()

    return loadingPromise
  }

  // == Answer Management ==
  const setAnswer = (questionnaireId: string, questionId: string, answer: Answer): void => {
    if (answers.value[questionnaireId]) {
      answers.value[questionnaireId][questionId] = answer
    }
  }

  const getAnswer = (questionnaireId: string, questionId: string): Answer | undefined => {
    return answers.value[questionnaireId]?.[questionId]
  }

  const getAllAnswersForQuestionnaire = (questionnaireId: string): AnswerMap => {
    return answers.value[questionnaireId] || {}
  }

  const clearAnswers = (questionnaireId: string): void => {
    if (answers.value[questionnaireId]) {
      answers.value[questionnaireId] = {}
    }
  }

  // == Logic Execution (injects _role from roleStore) ==
  const getEnhancedAnswers = (questionnaireId: string): Record<string, unknown> => {
    const roleStore = useRoleStore()
    const baseAnswers = getAllAnswersForQuestionnaire(questionnaireId)
    return {
      ...baseAnswers,
      _role: roleStore.role
    }
  }

  const validateConditions = (
    questionnaireId: string,
    conditionList: Condition[],
    providedAnswers: Record<string, unknown> | null = null
  ): ValidationResult => {
    const currentAnswers = providedAnswers || getEnhancedAnswers(questionnaireId)
    return validateConditionsEngine(currentAnswers, conditionList)
  }

  const determineOutcomeForPath = (
    questionnaireId: string,
    providedAnswers: AnswerMap,
    logic: ResultLogicRule[]
  ): OutcomeResult => {
    const roleStore = useRoleStore()
    const enhanced = { ...providedAnswers, _role: roleStore.role }
    return determineOutcome(enhanced, logic)
  }

  return {
    questionnaires,
    questions,
    steps,
    results,
    resultsLogic,
    answers,
    isLoading,
    dataReady,
    loadingPromise,

    questionnaireList,
    getQuestionnaireById,
    getQuestionById,
    getStepById,
    getResultByKey,
    getResultLogicById,
    getFullQuestionnaire,

    loadInitialData,

    setAnswer,
    getAnswer,
    getAllAnswersForQuestionnaire,
    clearAnswers,
    getEnhancedAnswers,

    validateConditions,
    determineOutcomeForPath
  }
})
