import {
  findNextQuestionId as findNextQuestionIdCore,
  getQuestionProgress,
  type ManifestQuestion,
  type ManifestStep,
  type QuestionProgress,
} from "@beslismodel/core";
import { computed, ref, toValue, type MaybeRefOrGetter } from "vue";
import type { BeslismodelAnswerMap } from "./store";

export interface BeslismodelRunnerQuestionnaire {
  readonly id: string;
  readonly version?: string;
  readonly questionIds: readonly string[];
  readonly stepIds: readonly string[];
}

export interface BeslismodelFullRunnerQuestionnaire<
  Question extends ManifestQuestion = ManifestQuestion,
  Step extends ManifestStep = ManifestStep,
> extends BeslismodelRunnerQuestionnaire {
  readonly questions: readonly Question[];
  readonly steps: readonly Step[];
}

export interface BeslismodelQuestionnaireRunnerStore<
  Answer = unknown,
  Question extends ManifestQuestion = ManifestQuestion,
  Step extends ManifestStep = ManifestStep,
  Questionnaire extends BeslismodelRunnerQuestionnaire = BeslismodelRunnerQuestionnaire,
  FullQuestionnaire extends BeslismodelFullRunnerQuestionnaire<Question, Step> =
    BeslismodelFullRunnerQuestionnaire<Question, Step>,
> {
  getAllAnswersForQuestionnaire(questionnaireId: string): BeslismodelAnswerMap<Answer>;
  getAnswer(questionnaireId: string, questionId: string): Answer | undefined;
  getEnhancedAnswers(questionnaireId: string): Record<string, unknown>;
  getFullQuestionnaire(questionnaireId: string): FullQuestionnaire | null;
  getQuestionById(questionId: string): Question | undefined;
  getQuestionnaireById(questionnaireId: string): Questionnaire | undefined;
  getStepById(stepId: string): Step | undefined;
}

export interface UseQuestionnaireRunnerOptions {
  readonly questionnaireId: MaybeRefOrGetter<string>;
}

export interface StartQuestionnaireRunnerOptions {
  readonly replayAnswers?: boolean;
  readonly resetHistory?: boolean;
}

export type BeslismodelRunnerTransition =
  | {
      readonly type: "question";
      readonly questionId: string;
      readonly previousQuestionId: string | null;
    }
  | {
      readonly type: "complete";
      readonly previousQuestionId: string | null;
    }
  | {
      readonly type: "missing";
      readonly questionnaireId: string;
    };

const isAnswerSelected = (answer: unknown): boolean => {
  if (answer === undefined || answer === null) return false;
  return Array.isArray(answer) ? answer.length > 0 : true;
};

export function useQuestionnaireRunner<
  Answer = unknown,
  Question extends ManifestQuestion = ManifestQuestion,
  Step extends ManifestStep = ManifestStep,
  Questionnaire extends BeslismodelRunnerQuestionnaire = BeslismodelRunnerQuestionnaire,
  FullQuestionnaire extends BeslismodelFullRunnerQuestionnaire<Question, Step> =
    BeslismodelFullRunnerQuestionnaire<Question, Step>,
>(
  store: BeslismodelQuestionnaireRunnerStore<
    Answer,
    Question,
    Step,
    Questionnaire,
    FullQuestionnaire
  >,
  options: UseQuestionnaireRunnerOptions,
) {
  const currentQuestionId = ref<string | null>(null);
  const questionHistory = ref<string[]>([]);

  const questionnaireId = computed(() => toValue(options.questionnaireId));
  const questionnaire = computed(() => store.getQuestionnaireById(questionnaireId.value));
  const fullQuestionnaire = computed(() => store.getFullQuestionnaire(questionnaireId.value));
  const currentQuestion = computed(() =>
    currentQuestionId.value ? (store.getQuestionById(currentQuestionId.value) ?? null) : null,
  );
  const currentStep = computed(() => {
    if (!currentQuestionId.value) return null;
    const stepId = fullQuestionnaire.value?.steps.find((step) =>
      step.questionIds.includes(currentQuestionId.value!),
    )?.id;
    return stepId ? (store.getStepById(stepId) ?? null) : null;
  });
  const hasHistory = computed(() => questionHistory.value.length > 0);
  const isMultiSelect = computed(() => {
    const type = currentQuestion.value?.type;
    return type === "multiple" || type === "multi_select";
  });
  const currentAnswer = computed(() =>
    currentQuestionId.value
      ? store.getAnswer(questionnaireId.value, currentQuestionId.value)
      : undefined,
  );
  const hasSelectedOptions = computed(() => isAnswerSelected(currentAnswer.value));
  const selectedCount = computed(() =>
    Array.isArray(currentAnswer.value) ? currentAnswer.value.length : 0,
  );
  const progressQuestionnaire = computed(() => {
    const source = fullQuestionnaire.value ?? questionnaire.value;
    if (!source) return null;
    return {
      questionIds: [...source.questionIds],
      questions: fullQuestionnaire.value?.questions.map((question) => ({
        conditions: question.conditions ? [...question.conditions] : undefined,
        id: question.id,
      })),
    };
  });
  const progress = computed<QuestionProgress>(() =>
    getQuestionProgress({
      answers: store.getEnhancedAnswers(questionnaireId.value),
      currentQuestionId: currentQuestionId.value,
      questionHistory: questionHistory.value,
      questionnaire: progressQuestionnaire.value,
    }),
  );

  const transitionFor = (
    questionId: string | null,
    previousQuestionId: string | null,
  ): BeslismodelRunnerTransition =>
    questionId
      ? { type: "question", questionId, previousQuestionId }
      : { type: "complete", previousQuestionId };

  const findNextQuestionId = (startQuestionId: string | null = null): string | null =>
    findNextQuestionIdCore({
      answers: store.getEnhancedAnswers(questionnaireId.value),
      questionnaire: fullQuestionnaire.value,
      startQuestionId,
    });

  const resetNavigation = (questionId: string | null = null): void => {
    currentQuestionId.value = questionId;
    questionHistory.value = [];
  };

  const replaceHistory = (history: readonly string[]): void => {
    questionHistory.value = [...history];
  };

  const pushHistory = (questionId: string | null): void => {
    if (questionId) questionHistory.value = [...questionHistory.value, questionId];
  };

  const setCurrentQuestion = (questionId: string | null): void => {
    currentQuestionId.value = questionId;
  };

  const start = (
    startOptions: StartQuestionnaireRunnerOptions = {},
  ): BeslismodelRunnerTransition => {
    if (!fullQuestionnaire.value) {
      return { type: "missing", questionnaireId: questionnaireId.value };
    }

    if (startOptions.resetHistory) {
      resetNavigation();
    }

    currentQuestionId.value = findNextQuestionId(null);

    if (startOptions.replayAnswers ?? true) {
      const answeredQuestionIds = Object.keys(
        store.getAllAnswersForQuestionnaire(questionnaireId.value),
      );
      const replayedHistory: string[] = [];
      let nextQuestionId = currentQuestionId.value;

      while (nextQuestionId && answeredQuestionIds.includes(nextQuestionId)) {
        replayedHistory.push(nextQuestionId);
        nextQuestionId = findNextQuestionId(nextQuestionId);
      }

      if (replayedHistory.length > 0) {
        questionHistory.value = replayedHistory;
        currentQuestionId.value = nextQuestionId;
      }
    }

    return transitionFor(currentQuestionId.value, null);
  };

  const advance = (): BeslismodelRunnerTransition => {
    if (!fullQuestionnaire.value) {
      return { type: "missing", questionnaireId: questionnaireId.value };
    }

    const previousQuestionId = currentQuestionId.value;
    pushHistory(previousQuestionId);
    currentQuestionId.value = findNextQuestionId(previousQuestionId);
    return transitionFor(currentQuestionId.value, previousQuestionId);
  };

  const goBack = (): BeslismodelRunnerTransition => {
    if (!fullQuestionnaire.value) {
      return { type: "missing", questionnaireId: questionnaireId.value };
    }

    const history = [...questionHistory.value];
    const previousQuestionId = currentQuestionId.value;
    currentQuestionId.value = history.pop() ?? currentQuestionId.value;
    questionHistory.value = history;
    return transitionFor(currentQuestionId.value, previousQuestionId);
  };

  return {
    advance,
    currentAnswer,
    currentQuestion,
    currentQuestionId,
    currentStep,
    findNextQuestionId,
    fullQuestionnaire,
    goBack,
    hasHistory,
    hasSelectedOptions,
    isMultiSelect,
    progress,
    pushHistory,
    questionnaire,
    questionnaireId,
    questionHistory,
    replaceHistory,
    resetNavigation,
    selectedCount,
    setCurrentQuestion,
    start,
  };
}
