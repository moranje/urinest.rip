import {
  findNextQuestionId as findNextQuestionIdCore,
  getQuestionProgress,
  validateConditions,
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
  setAnswer(questionnaireId: string, questionId: string, answer: Answer): void;
}

export interface UseQuestionnaireRunnerOptions {
  readonly questionnaireId: MaybeRefOrGetter<string>;
}

export interface StartQuestionnaireRunnerOptions {
  readonly replayAnswers?: boolean;
  readonly resetHistory?: boolean;
}

export interface BeslismodelRunnerOptionAnswer {
  readonly text: string;
  readonly value: string;
}

export type BeslismodelRunnerTransition =
  | {
      readonly type: "question";
      readonly questionId: string;
      readonly previousQuestionId: string | null;
      readonly branch?: string;
    }
  | {
      readonly type: "complete";
      readonly previousQuestionId: string | null;
      readonly branch?: string;
    }
  | {
      readonly type: "missing";
      readonly questionnaireId: string;
    };

const isAnswerSelected = (answer: unknown): boolean => {
  if (answer === undefined || answer === null) return false;
  return Array.isArray(answer) ? answer.length > 0 : true;
};

const answerValue = (answer: unknown): unknown =>
  typeof answer === "object" && answer !== null && "value" in answer
    ? (answer as { readonly value?: unknown }).value
    : answer;

const optionAnswer = (option: {
  readonly value: string;
  readonly text: string;
}): BeslismodelRunnerOptionAnswer => ({
  text: option.text,
  value: option.value,
});

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
  const answerRevision = ref(0);

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
  const currentStepQuestions = computed(() => {
    if (!currentStep.value) return [];
    const answers = store.getEnhancedAnswers(questionnaireId.value);
    return currentStep.value.questionIds
      .map((questionId) => store.getQuestionById(questionId))
      .filter((question): question is Question => {
        if (!question) return false;
        return validateConditions(answers, question.conditions).isValid;
      });
  });
  const isCurrentStepGrouped = computed(() => {
    const inputMode = currentStep.value?.metadata?.inputMode;
    return inputMode === "group" && currentStepQuestions.value.length > 1;
  });
  const hasHistory = computed(() => questionHistory.value.length > 0);
  const isMultiSelect = computed(() => {
    const type = currentQuestion.value?.type;
    return type === "multiple" || type === "multi_select";
  });
  const currentAnswer = computed(() => {
    // Plain-object stores do not trigger Vue by themselves; this ref invalidates the read.
    if (answerRevision.value < 0) return undefined;
    return currentQuestionId.value
      ? store.getAnswer(questionnaireId.value, currentQuestionId.value)
      : undefined;
  });
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
    branch?: string,
  ): BeslismodelRunnerTransition => {
    const branchData = branch === undefined ? {} : { branch };
    return questionId
      ? { ...branchData, type: "question", questionId, previousQuestionId }
      : { ...branchData, type: "complete", previousQuestionId };
  };

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

  const setCurrentAnswer = (answer: Answer): void => {
    if (!currentQuestionId.value) return;
    store.setAnswer(questionnaireId.value, currentQuestionId.value, answer);
    answerRevision.value += 1;
  };

  const setAnswerForQuestion = (questionId: string, answer: Answer): void => {
    store.setAnswer(questionnaireId.value, questionId, answer);
    answerRevision.value += 1;
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

  const advance = (branch?: string): BeslismodelRunnerTransition => {
    if (!fullQuestionnaire.value) {
      return { type: "missing", questionnaireId: questionnaireId.value };
    }

    const previousQuestionId = currentQuestionId.value;
    pushHistory(previousQuestionId);
    currentQuestionId.value = findNextQuestionId(previousQuestionId);
    return transitionFor(currentQuestionId.value, previousQuestionId, branch);
  };

  const advanceCurrentStep = (branch?: string): BeslismodelRunnerTransition => {
    if (!fullQuestionnaire.value) {
      return { type: "missing", questionnaireId: questionnaireId.value };
    }

    const previousQuestionId = currentQuestionId.value;
    pushHistory(previousQuestionId);
    const stepQuestions = currentStepQuestions.value;
    const lastStepQuestionId = stepQuestions.at(-1)?.id ?? previousQuestionId;
    currentQuestionId.value = findNextQuestionId(lastStepQuestionId);
    return transitionFor(currentQuestionId.value, previousQuestionId, branch);
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

  const isOptionSelected = (option: { readonly value: string }): boolean => {
    if (!currentAnswer.value) return false;
    if (Array.isArray(currentAnswer.value)) {
      return currentAnswer.value.some((answer) => answerValue(answer) === option.value);
    }
    return answerValue(currentAnswer.value) === option.value;
  };

  const selectOption = (option: {
    readonly id?: string;
    readonly value: string;
    readonly text: string;
  }): BeslismodelRunnerTransition => {
    if (!currentQuestionId.value) {
      return { type: "missing", questionnaireId: questionnaireId.value };
    }

    setCurrentAnswer(optionAnswer(option) as Answer);
    return advance(option.id);
  };

  const toggleOption = (option: {
    readonly value: string;
    readonly text: string;
  }): readonly BeslismodelRunnerOptionAnswer[] => {
    if (!currentQuestionId.value) return [];
    const existingAnswers = Array.isArray(currentAnswer.value)
      ? (currentAnswer.value as readonly BeslismodelRunnerOptionAnswer[])
      : [];
    const nextAnswers = [...existingAnswers];
    const existingIndex = nextAnswers.findIndex((answer) => answerValue(answer) === option.value);

    if (existingIndex >= 0) {
      nextAnswers.splice(existingIndex, 1);
    } else {
      nextAnswers.push(optionAnswer(option));
    }

    setCurrentAnswer(nextAnswers as Answer);
    return nextAnswers;
  };

  const confirmMultipleChoice = (): BeslismodelRunnerTransition => {
    const answers = Array.isArray(currentAnswer.value) ? currentAnswer.value : [];
    const branch = answers
      .map((answer) => String(answerValue(answer)))
      .sort()
      .join("+");
    return advance(branch || undefined);
  };

  return {
    advance,
    advanceCurrentStep,
    confirmMultipleChoice,
    currentAnswer,
    currentQuestion,
    currentQuestionId,
    currentStep,
    currentStepQuestions,
    findNextQuestionId,
    fullQuestionnaire,
    goBack,
    hasHistory,
    hasSelectedOptions,
    isMultiSelect,
    isCurrentStepGrouped,
    isOptionSelected,
    progress,
    pushHistory,
    questionnaire,
    questionnaireId,
    questionHistory,
    replaceHistory,
    resetNavigation,
    selectedCount,
    setCurrentQuestion,
    setAnswerForQuestion,
    selectOption,
    start,
    toggleOption,
  };
}
