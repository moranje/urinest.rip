// Toast system
export interface Toast {
  id: number
  level: ToastLevel
  message: string
  dismissible: boolean
}

export type ToastLevel = 'error' | 'warning' | 'success' | 'info'

export interface ToastOptions {
  duration?: number
  dismissible?: boolean
}

// Role system
export type UserRole = 'behandelaar' | 'triagist'

// Decision engine types
export interface QuestionOption {
  id: string
  value: string
  text: string
  description?: string
}

export interface Condition {
  questionId: string
  operator: string
  value: unknown
}

export interface Question {
  id: string
  text: string
  type: 'single' | 'multiple' | 'multi_select'
  options: QuestionOption[]
  conditions?: Condition[]
  description?: string
}

export interface Step {
  id: string
  description?: string
  questionIds: string[]
}

export interface ResultLogicRule {
  id: string
  conditions: Condition[]
  actionType: string
  resultKey?: string
  redirectToQuestionnaire?: string
}

export interface QuestionnaireMeta {
  id: string
  name: string
  title: string
  description?: string
  icon?: string
  questionIds: string[]
  stepIds: string[]
  resultsLogicIds: string[]
}

export interface FullQuestionnaire extends QuestionnaireMeta {
  questions: Question[]
  steps: Step[]
  resultsLogic: ResultLogicRule[]
}

export interface Source {
  name: string
  url?: string
}

export interface Contraindication {
  id: string
  text: string
  checked?: boolean
}

export interface ResultData {
  title: string
  description?: string
  urgency?: string
  treatment?: string
  warnings?: string
  contraindications?: Contraindication[]
  explainer?: string
  documentation?: string
  additionalTests?: string
  testAfterTreatment?: string
  sources?: Source[]
}

export interface AnswerValue {
  value: string
  text: string
}

export type Answer = AnswerValue | AnswerValue[]

export type AnswerMap = Record<string, Answer>

export interface ValidationResult {
  isValid: boolean
  matchedCount: number
}

export interface OutcomeResult {
  outcome: string | null
  ruleId: string | null
}

// Popover styling
import type { CSSProperties } from 'vue'

export interface PopoverStyle {
  position?: CSSProperties['position']
  top?: string
  left?: string
  right?: string
  visibility?: CSSProperties['visibility']
  opacity?: number
  maxWidth?: string
}

// Route meta
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}
