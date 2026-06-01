import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { determineOutcome } from "decision-engine-core";
import {
  applyRuntimeContext,
  createRuntimeContext,
  normalizeDecisionManifest,
  validateConditions as validateConditionsCore,
  type DecisionManifest,
  type RuntimeContext,
} from "@beslismodel/core";
import { breadcrumbApi } from "../lib/breadcrumbs";
import { handleError, HttpStatusError, TimeoutError } from "../lib/errors";
import { guidelineReviews } from "../lib/guidelines";
import { persistTelemetry } from "../lib/log-sink";
import { readStorage, removeStorage, writeStorage } from "../lib/storage";
import { appConfig } from "../config/app-config";
import { useRoleStore } from "./roleStore";
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
  OutcomeResult,
} from "../types";

type RawResultLogicRule = Omit<ResultLogicRule, "id"> & { id?: string };

interface RawQuestionnaire {
  id: string;
  version?: string;
  name: string;
  title: string;
  description?: string;
  category?: string;
  audience?: readonly string[];
  domain?: string;
  icon?: string;
  hiddenFromLandingPage?: boolean;
  recommendedStart?: boolean;
  questions?: Question[];
  steps?: Step[];
  results?: Record<string, ResultData>;
  resultsLogic?: RawResultLogicRule[];
}

interface FetchedData {
  questionnaires?: RawQuestionnaire[];
}

interface PersistedAnswers {
  version: 1;
  updatedAt: number;
  answers: Record<string, AnswerMap>;
}

const ANSWERS_STORAGE_KEY = appConfig.storage.answersKey;
const ANSWERS_TTL_MS = appConfig.storage.answersTtlMs;

function isAnswerMap(value: unknown): value is AnswerMap {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const useQuestionnaireStore = defineStore("questionnaire", () => {
  // == NORMALIZED STATE ==
  const questionnaires = ref<Record<string, QuestionnaireMeta>>({});
  const questions = ref<Record<string, Question>>({});
  const steps = ref<Record<string, Step>>({});
  const results = ref<Record<string, ResultData>>({});
  const resultsLogic = ref<Record<string, ResultLogicRule>>({});
  const answers = ref<Record<string, AnswerMap>>({});

  const isLoading = ref(false);
  const dataReady = ref(false);
  let loadingPromise: Promise<void> | null = null;

  const persistAnswers = (): void => {
    const payload: PersistedAnswers = {
      version: 1,
      updatedAt: Date.now(),
      answers: answers.value,
    };
    if (!writeStorage("session", ANSWERS_STORAGE_KEY, JSON.stringify(payload))) {
      handleError(new Error("Questionnaire answer storage unavailable"), "answers:write-storage");
    }
  };

  const restorePersistedAnswers = (
    baseAnswers: Record<string, AnswerMap>,
  ): Record<string, AnswerMap> => {
    const raw = readStorage("session", ANSWERS_STORAGE_KEY);
    if (!raw) return baseAnswers;

    try {
      const parsed = JSON.parse(raw) as Partial<PersistedAnswers>;
      if (
        parsed.version !== 1 ||
        typeof parsed.updatedAt !== "number" ||
        Date.now() - parsed.updatedAt > ANSWERS_TTL_MS ||
        !isAnswerMap(parsed.answers)
      ) {
        removeStorage("session", ANSWERS_STORAGE_KEY);
        return baseAnswers;
      }

      const restored: Record<string, AnswerMap> = { ...baseAnswers };
      for (const questionnaireId of Object.keys(baseAnswers)) {
        const storedAnswers = parsed.answers[questionnaireId];
        if (isAnswerMap(storedAnswers)) {
          restored[questionnaireId] = storedAnswers;
        }
      }
      return restored;
    } catch (error) {
      removeStorage("session", ANSWERS_STORAGE_KEY);
      handleError(error, "answers:read-storage");
      return baseAnswers;
    }
  };

  // --- Getters ---
  const getQuestionnaireById = (id: string): QuestionnaireMeta | undefined =>
    questionnaires.value[id];
  const getQuestionById = (id: string): Question | undefined => questions.value[id];
  const getStepById = (id: string): Step | undefined => steps.value[id];
  const getResultByKey = (key: string): ResultData | undefined => results.value[key];
  const getResultLogicById = (id: string): ResultLogicRule | undefined => resultsLogic.value[id];

  const questionnaireList = computed(() => Object.values(questionnaires.value));

  const getFullQuestionnaire = (questionnaireId: string): FullQuestionnaire | null => {
    const meta = getQuestionnaireById(questionnaireId);
    if (!meta) return null;

    return {
      ...meta,
      questions: meta.questionIds.map((id) => getQuestionById(id)!).filter(Boolean),
      steps: meta.stepIds.map((id) => getStepById(id)!).filter(Boolean),
      resultsLogic: meta.resultsLogicIds.map((id) => getResultLogicById(id)!).filter(Boolean),
    };
  };

  // --- Data Loading ---
  const processFetchedData = (data: FetchedData): void => {
    if (!data?.questionnaires) return;

    const manifest: DecisionManifest<ResultData> = {
      questionnaires: data.questionnaires.map((q) => ({
        id: q.id,
        version: q.version ?? "unknown",
        name: q.name,
        title: q.title,
        description: q.description,
        category: q.category,
        audience: q.audience,
        domain: q.domain,
        icon: q.icon,
        hiddenFromLandingPage: q.hiddenFromLandingPage,
        recommendedStart: q.recommendedStart,
        questions: q.questions ?? [],
        steps: q.steps ?? [],
        results: q.results ?? {},
        resultsLogic: q.resultsLogic ?? [],
      })),
    };
    const normalized = normalizeDecisionManifest(manifest, { duplicateIdPolicy: "overwrite" });
    const newQuestionnaires: Record<string, QuestionnaireMeta> = {};
    const newAnswers: Record<string, AnswerMap> = {};

    for (const [id, q] of Object.entries(normalized.questionnaires)) {
      newQuestionnaires[id] = {
        ...q,
        name: q.name ?? q.title,
        questionIds: [...q.questionIds],
        stepIds: [...q.stepIds],
        resultsLogicIds: [...q.resultsLogicIds],
      };
      newAnswers[q.id] = {};
    }

    questionnaires.value = newQuestionnaires;
    questions.value = { ...normalized.questions } as Record<string, Question>;
    steps.value = { ...normalized.steps } as Record<string, Step>;
    results.value = { ...normalized.results };
    resultsLogic.value = { ...normalized.resultsLogic } as Record<string, ResultLogicRule>;
    answers.value = restorePersistedAnswers(newAnswers);
    dataReady.value = true;

    persistTelemetry({
      module: "questionnaire-store",
      message: "flow.versions",
      context: {
        flows: Object.values(newQuestionnaires).map((q) => ({ id: q.id, version: q.version })),
        guidelines: guidelineReviews.map((g) => ({
          name: g.name,
          reviewed: g.reviewedIso,
        })),
      },
    });
  };

  const loadInitialData = async (): Promise<void> => {
    if (isLoading.value && loadingPromise) {
      return loadingPromise;
    }
    isLoading.value = true;
    dataReady.value = false;

    loadingPromise = (async () => {
      try {
        const started = performance.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(new TimeoutError(10000)), 10000);
        const response = await fetch(`${appConfig.manifestUrl}?t=${Date.now()}`, {
          signal: controller.signal,
        })
          .catch((error: unknown) => {
            if (controller.signal.aborted && controller.signal.reason) {
              throw controller.signal.reason;
            }
            throw error;
          })
          .finally(() => clearTimeout(timeout));
        breadcrumbApi("GET", appConfig.manifestUrl, Math.round(performance.now() - started));
        if (!response.ok) {
          throw new HttpStatusError(
            response.status,
            `Failed to fetch main.json: ${response.statusText}`,
            response.headers.get("Retry-After"),
            response.headers,
          );
        }
        const data: FetchedData = await response.json();
        processFetchedData(data);
      } catch (error) {
        handleError(error, "questionnaire-store:load-initial");
        throw error;
      } finally {
        isLoading.value = false;
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  };

  // == Answer Management ==
  const setAnswer = (questionnaireId: string, questionId: string, answer: Answer): void => {
    if (answers.value[questionnaireId]) {
      answers.value[questionnaireId][questionId] = answer;
      persistAnswers();
    }
  };

  const getAnswer = (questionnaireId: string, questionId: string): Answer | undefined => {
    return answers.value[questionnaireId]?.[questionId];
  };

  const getAllAnswersForQuestionnaire = (questionnaireId: string): AnswerMap => {
    return answers.value[questionnaireId] || {};
  };

  const clearAnswers = (questionnaireId: string): void => {
    if (answers.value[questionnaireId]) {
      answers.value[questionnaireId] = {};
      persistAnswers();
    }
  };

  const getRuntimeContext = (): RuntimeContext => {
    const roleStore = useRoleStore();
    return createRuntimeContext({ role: roleStore.role });
  };

  // == Logic Execution (injects runtime context for legacy engine conditions) ==
  const getEnhancedAnswers = (questionnaireId: string): Record<string, unknown> => {
    const baseAnswers = getAllAnswersForQuestionnaire(questionnaireId);
    return applyRuntimeContext(baseAnswers, getRuntimeContext(), { aliases: { role: "_role" } });
  };

  const validateConditions = (
    questionnaireId: string,
    conditionList: Condition[],
    providedAnswers: Record<string, unknown> | null = null,
  ): ValidationResult => {
    const currentAnswers = providedAnswers || getEnhancedAnswers(questionnaireId);
    try {
      return validateConditionsCore(currentAnswers, conditionList);
    } catch (error) {
      handleError(error, "decision-engine:validate-conditions", {
        questionnaireId,
        conditionCount: conditionList.length,
      });
      throw error;
    }
  };

  const determineOutcomeForPath = (
    questionnaireId: string,
    providedAnswers: AnswerMap,
    logic: ResultLogicRule[],
  ): OutcomeResult => {
    const runtimeContext = getRuntimeContext();
    const enhanced = applyRuntimeContext(providedAnswers, runtimeContext, {
      aliases: { role: "_role" },
    });
    try {
      return determineOutcome(enhanced, logic);
    } catch (error) {
      handleError(error, "decision-engine:determine-outcome", {
        questionnaireId,
        role: runtimeContext.get("role"),
        logicCount: logic.length,
      });
      throw error;
    }
  };

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
    getRuntimeContext,
    getEnhancedAnswers,

    validateConditions,
    determineOutcomeForPath,
  };
});
