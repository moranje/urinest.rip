import {
  applyRuntimeContext,
  createRuntimeContext,
  getErrorClass,
  normalizeDecisionManifest,
  validateConditions as validateConditionsCore,
  type DecisionManifest,
  type DuplicateManifestIdPolicy,
  type ManifestCondition,
  type ManifestQuestion,
  type ManifestQuestionnaire,
  type ManifestStep,
  type NormalizedDecisionManifest,
  type NormalizedQuestionnaireMeta,
  type NormalizedResultLogicRule,
  type RuntimeContext,
  type RuntimeContextValues,
} from "@beslismodel/core";
import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import { noopTelemetryAdapter, type BeslismodelTelemetryAdapter } from "./telemetry";

export interface BeslismodelStorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export type BeslismodelAnswerMap<Answer = unknown> = Record<string, Answer>;

export interface BeslismodelPersistedAnswers<Answer = unknown> {
  readonly version: 1;
  readonly updatedAt: number;
  readonly answers: Record<string, BeslismodelAnswerMap<Answer>>;
}

export type BeslismodelManifestCacheStrategy = "memory" | "reload";

export interface BeslismodelLoadInitialDataOptions {
  readonly force?: boolean;
}

export interface BeslismodelOutcomeResult {
  readonly outcome: string | null;
  readonly ruleId: string | null;
}

export type BeslismodelOutcomeResolver<
  ResultLogicRule extends NormalizedResultLogicRule = NormalizedResultLogicRule,
  Outcome extends BeslismodelOutcomeResult = BeslismodelOutcomeResult,
> = (
  answers: Readonly<Record<string, unknown>>,
  logic: readonly ResultLogicRule[],
  context: RuntimeContext,
) => Outcome;

export type BeslismodelQuestionnaireInput<ResultData = Readonly<Record<string, unknown>>> = Omit<
  ManifestQuestionnaire<ResultData>,
  "version"
> & {
  readonly version?: string;
};

export interface BeslismodelManifestInput<ResultData = Readonly<Record<string, unknown>>> {
  readonly questionnaires?: readonly BeslismodelQuestionnaireInput<ResultData>[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface BeslismodelQuestionnaireMeta extends Omit<
  NormalizedQuestionnaireMeta,
  "name" | "questionIds" | "stepIds" | "resultsLogicIds"
> {
  readonly name: string;
  readonly questionIds: string[];
  readonly stepIds: string[];
  readonly resultsLogicIds: string[];
}

export type BeslismodelFullQuestionnaire<
  QuestionnaireMeta extends BeslismodelQuestionnaireMeta = BeslismodelQuestionnaireMeta,
  Question extends ManifestQuestion = ManifestQuestion,
  Step extends ManifestStep = ManifestStep,
  ResultLogicRule extends NormalizedResultLogicRule = NormalizedResultLogicRule,
> = QuestionnaireMeta & {
  readonly questions: Question[];
  readonly steps: Step[];
  readonly resultsLogic: ResultLogicRule[];
};

export interface BeslismodelStoreErrorContext {
  readonly phase:
    | "answers.persist"
    | "answers.restore"
    | "conditions.validate"
    | "manifest.load"
    | "outcome.resolve";
  readonly storeId: string;
  readonly questionnaireId?: string;
  readonly conditionCount?: number;
  readonly logicCount?: number;
}

export interface CreateBeslismodelStoreOptions<
  ResultData = Readonly<Record<string, unknown>>,
  QuestionnaireMeta extends BeslismodelQuestionnaireMeta = BeslismodelQuestionnaireMeta,
  ResultLogicRule extends NormalizedResultLogicRule = NormalizedResultLogicRule,
  Outcome extends BeslismodelOutcomeResult = BeslismodelOutcomeResult,
> {
  readonly id?: string;
  readonly storeId?: string;
  readonly loadManifest: () => Promise<BeslismodelManifestInput<ResultData>>;
  readonly duplicateIdPolicy?: DuplicateManifestIdPolicy;
  readonly manifestCacheStrategy?: BeslismodelManifestCacheStrategy;
  readonly storage?: BeslismodelStorageAdapter;
  readonly answersStorage?: BeslismodelStorageAdapter;
  readonly answersStorageKey?: string;
  readonly answersTtlMs?: number;
  readonly contextProvider?: () => RuntimeContext | RuntimeContextValues;
  readonly contextAliases?: Readonly<Record<string, string>>;
  readonly outcomeResolver?: BeslismodelOutcomeResolver<ResultLogicRule, Outcome>;
  readonly telemetry?: BeslismodelTelemetryAdapter;
  readonly onError?: (error: Error, context: BeslismodelStoreErrorContext) => void;
  readonly onManifestLoaded?: (
    manifest: NormalizedDecisionManifest<ResultData>,
    questionnaires: Readonly<Record<string, QuestionnaireMeta>>,
  ) => void;
  readonly now?: () => number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toError = (caught: unknown): Error => (caught instanceof Error ? caught : new Error("Error"));

const isRuntimeContext = (value: RuntimeContext | RuntimeContextValues): value is RuntimeContext =>
  isRecord(value) && "values" in value && "get" in value && typeof value.get === "function";

const toDecisionManifest = <ResultData>(
  manifest: BeslismodelManifestInput<ResultData>,
): DecisionManifest<ResultData> => ({
  metadata: manifest.metadata,
  questionnaires: (manifest.questionnaires ?? []).map((questionnaire) => ({
    ...questionnaire,
    version: questionnaire.version ?? "unknown",
  })),
});

export function createBeslismodelStore<
  ResultData = Readonly<Record<string, unknown>>,
  Answer = unknown,
  QuestionnaireMeta extends BeslismodelQuestionnaireMeta = BeslismodelQuestionnaireMeta,
  Question extends ManifestQuestion = ManifestQuestion,
  Step extends ManifestStep = ManifestStep,
  ResultLogicRule extends NormalizedResultLogicRule = NormalizedResultLogicRule,
  Outcome extends BeslismodelOutcomeResult = BeslismodelOutcomeResult,
>(options: CreateBeslismodelStoreOptions<ResultData, QuestionnaireMeta, ResultLogicRule, Outcome>) {
  const storeId = options.storeId ?? options.id ?? "beslismodel";
  const telemetry = options.telemetry ?? noopTelemetryAdapter;
  const manifestCacheStrategy = options.manifestCacheStrategy ?? "memory";
  const answersStorage = options.answersStorage ?? options.storage;
  const answersStorageKey = options.answersStorageKey;
  const answersTtlMs = options.answersTtlMs;
  const now = options.now ?? Date.now;

  return defineStore(storeId, () => {
    const questionnaires = shallowRef<Record<string, QuestionnaireMeta>>({});
    const questions = shallowRef<Record<string, Question>>({});
    const steps = shallowRef<Record<string, Step>>({});
    const results = shallowRef<Record<string, ResultData>>({});
    const resultsLogic = shallowRef<Record<string, ResultLogicRule>>({});
    const answers = shallowRef<Record<string, BeslismodelAnswerMap<Answer>>>({});

    const isLoading = ref(false);
    const dataReady = ref(false);
    const loadingPromise = shallowRef<Promise<void> | null>(null);
    const manifest = shallowRef<NormalizedDecisionManifest<ResultData> | null>(null);
    const error = shallowRef<Error | null>(null);

    const getRuntimeContext = (): RuntimeContext => {
      const provided = options.contextProvider?.() ?? {};
      return isRuntimeContext(provided) ? provided : createRuntimeContext(provided);
    };

    const runtimeContext = computed(() => getRuntimeContext().values);

    const reportError = (caught: unknown, context: BeslismodelStoreErrorContext): Error => {
      const reported = toError(caught);
      error.value = null;
      error.value = reported;
      options.onError?.(reported, context);
      return reported;
    };

    const persistAnswers = (): void => {
      if (!answersStorage || !answersStorageKey) return;
      const payload: BeslismodelPersistedAnswers<Answer> = {
        version: 1,
        updatedAt: now(),
        answers: answers.value,
      };

      Promise.resolve(answersStorage.setItem(answersStorageKey, JSON.stringify(payload))).catch(
        (caught: unknown) => {
          const persistError = toError(caught);
          telemetry.track({
            type: "answers.persist_failed",
            phase: "answers.persist",
            storeId,
            errorClass: getErrorClass(persistError),
          });
          options.onError?.(persistError, {
            phase: "answers.persist",
            storeId,
          });
        },
      );
    };

    const restorePersistedAnswers = async (
      baseAnswers: Record<string, BeslismodelAnswerMap<Answer>>,
    ): Promise<Record<string, BeslismodelAnswerMap<Answer>>> => {
      if (!answersStorage || !answersStorageKey || !answersTtlMs) return baseAnswers;

      try {
        const raw = await answersStorage.getItem(answersStorageKey);
        if (!raw) return baseAnswers;

        const parsed = JSON.parse(raw) as Partial<BeslismodelPersistedAnswers<Answer>>;
        if (
          parsed.version !== 1 ||
          typeof parsed.updatedAt !== "number" ||
          now() - parsed.updatedAt > answersTtlMs ||
          !isRecord(parsed.answers)
        ) {
          await answersStorage.removeItem(answersStorageKey);
          return baseAnswers;
        }

        const restored: Record<string, BeslismodelAnswerMap<Answer>> = { ...baseAnswers };
        for (const questionnaireId of Object.keys(baseAnswers)) {
          const storedAnswers = parsed.answers[questionnaireId];
          if (isRecord(storedAnswers)) {
            restored[questionnaireId] = storedAnswers as BeslismodelAnswerMap<Answer>;
          }
        }
        return restored;
      } catch (caught) {
        const restoreError = toError(caught);
        await Promise.resolve(answersStorage.removeItem(answersStorageKey)).catch(() => undefined);
        telemetry.track({
          type: "answers.restore_failed",
          phase: "answers.restore",
          storeId,
          errorClass: getErrorClass(restoreError),
        });
        options.onError?.(restoreError, {
          phase: "answers.restore",
          storeId,
        });
        return baseAnswers;
      }
    };

    const getQuestionnaireById = (id: string): QuestionnaireMeta | undefined =>
      questionnaires.value[id];
    const getQuestionById = (id: string): Question | undefined => questions.value[id];
    const getStepById = (id: string): Step | undefined => steps.value[id];
    const getResultByKey = (key: string): ResultData | undefined => results.value[key];
    const getResultLogicById = (id: string): ResultLogicRule | undefined => resultsLogic.value[id];

    const questionnaireList = computed(() => Object.values(questionnaires.value));

    const getFullQuestionnaire = (
      questionnaireId: string,
    ): BeslismodelFullQuestionnaire<QuestionnaireMeta, Question, Step, ResultLogicRule> | null => {
      const meta = getQuestionnaireById(questionnaireId);
      if (!meta) return null;

      return {
        ...meta,
        questions: meta.questionIds.map((id) => getQuestionById(id)!).filter(Boolean),
        steps: meta.stepIds.map((id) => getStepById(id)!).filter(Boolean),
        resultsLogic: meta.resultsLogicIds.map((id) => getResultLogicById(id)!).filter(Boolean),
      };
    };

    async function loadInitialData(
      loadOptions: BeslismodelLoadInitialDataOptions = {},
    ): Promise<void> {
      if (dataReady.value && manifestCacheStrategy === "memory" && !loadOptions.force) {
        return;
      }

      if (isLoading.value && loadingPromise.value) {
        return loadingPromise.value;
      }

      isLoading.value = true;
      dataReady.value = false;
      error.value = null;

      loadingPromise.value = (async () => {
        try {
          const loadedManifest = toDecisionManifest(await options.loadManifest());
          const normalized = normalizeDecisionManifest(loadedManifest, {
            duplicateIdPolicy: options.duplicateIdPolicy,
          });
          const newQuestionnaires: Record<string, QuestionnaireMeta> = {};
          const newAnswers: Record<string, BeslismodelAnswerMap<Answer>> = {};

          for (const [id, questionnaire] of Object.entries(normalized.questionnaires)) {
            newQuestionnaires[id] = {
              ...questionnaire,
              name: questionnaire.name ?? questionnaire.title,
              questionIds: [...questionnaire.questionIds],
              stepIds: [...questionnaire.stepIds],
              resultsLogicIds: [...questionnaire.resultsLogicIds],
            } as QuestionnaireMeta;
            newAnswers[id] = {};
          }

          questionnaires.value = newQuestionnaires;
          questions.value = { ...normalized.questions } as Record<string, Question>;
          steps.value = { ...normalized.steps } as Record<string, Step>;
          results.value = { ...normalized.results };
          resultsLogic.value = { ...normalized.resultsLogic } as Record<string, ResultLogicRule>;
          answers.value = await restorePersistedAnswers(newAnswers);
          manifest.value = normalized;
          dataReady.value = true;

          telemetry.track({
            type: "manifest.loaded",
            storeId,
            questionnaireCount: Object.keys(newQuestionnaires).length,
          });
          options.onManifestLoaded?.(normalized, newQuestionnaires);
        } catch (caught) {
          const loadError = reportError(caught, {
            phase: "manifest.load",
            storeId,
          });
          telemetry.track({
            type: "manifest.load_failed",
            phase: "manifest.load",
            storeId,
            errorClass: getErrorClass(loadError),
          });
          throw loadError;
        } finally {
          isLoading.value = false;
          loadingPromise.value = null;
        }
      })();

      return loadingPromise.value;
    }

    async function load(): Promise<NormalizedDecisionManifest<ResultData>> {
      await loadInitialData();
      if (!manifest.value) {
        throw new Error("Manifest not loaded");
      }
      return manifest.value;
    }

    const setAnswer = (questionnaireId: string, questionId: string, answer: Answer): void => {
      if (answers.value[questionnaireId]) {
        answers.value = {
          ...answers.value,
          [questionnaireId]: {
            ...answers.value[questionnaireId],
            [questionId]: answer,
          },
        };
        persistAnswers();
      }
    };

    const getAnswer = (questionnaireId: string, questionId: string): Answer | undefined =>
      answers.value[questionnaireId]?.[questionId];

    const getAllAnswersForQuestionnaire = (questionnaireId: string): BeslismodelAnswerMap<Answer> =>
      answers.value[questionnaireId] || {};

    const clearAnswers = (questionnaireId: string): void => {
      if (answers.value[questionnaireId]) {
        answers.value = {
          ...answers.value,
          [questionnaireId]: {},
        };
        persistAnswers();
      }
    };

    const getEnhancedAnswers = (questionnaireId: string): Record<string, unknown> =>
      applyRuntimeContext(getAllAnswersForQuestionnaire(questionnaireId), getRuntimeContext(), {
        aliases: options.contextAliases,
      });

    const validateConditions = (
      questionnaireId: string,
      conditionList: readonly ManifestCondition[],
      providedAnswers: Record<string, unknown> | null = null,
    ) => {
      const currentAnswers = providedAnswers || getEnhancedAnswers(questionnaireId);
      try {
        return validateConditionsCore(currentAnswers, conditionList);
      } catch (caught) {
        const validationError = toError(caught);
        telemetry.track({
          type: "conditions.validate_failed",
          phase: "conditions.validate",
          storeId,
          questionnaireId,
          conditionCount: conditionList.length,
          errorClass: getErrorClass(validationError),
        });
        options.onError?.(validationError, {
          phase: "conditions.validate",
          storeId,
          questionnaireId,
          conditionCount: conditionList.length,
        });
        throw validationError;
      }
    };

    const determineOutcomeForPath = (
      questionnaireId: string,
      providedAnswers: BeslismodelAnswerMap<Answer>,
      logic: readonly ResultLogicRule[],
    ): Outcome => {
      if (!options.outcomeResolver) {
        throw new Error("No outcome resolver configured");
      }

      const currentContext = getRuntimeContext();
      const enhanced = applyRuntimeContext(providedAnswers, currentContext, {
        aliases: options.contextAliases,
      });
      try {
        return options.outcomeResolver(enhanced, logic, currentContext);
      } catch (caught) {
        const outcomeError = toError(caught);
        telemetry.track({
          type: "outcome.resolve_failed",
          phase: "outcome.resolve",
          storeId,
          questionnaireId,
          logicCount: logic.length,
          errorClass: getErrorClass(outcomeError),
        });
        options.onError?.(outcomeError, {
          phase: "outcome.resolve",
          storeId,
          questionnaireId,
          logicCount: logic.length,
        });
        throw outcomeError;
      }
    };

    return {
      answers,
      clearAnswers,
      dataReady,
      determineOutcomeForPath,
      error,
      getAllAnswersForQuestionnaire,
      getAnswer,
      getEnhancedAnswers,
      getFullQuestionnaire,
      getQuestionById,
      getQuestionnaireById,
      getResultByKey,
      getResultLogicById,
      getRuntimeContext,
      getStepById,
      isLoading,
      load,
      loadInitialData,
      loading: isLoading,
      loadingPromise,
      manifest,
      questionnaireList,
      questionnaires,
      questions,
      results,
      resultsLogic,
      runtimeContext,
      setAnswer,
      steps,
      storage: answersStorage,
      validateConditions,
    };
  });
}
