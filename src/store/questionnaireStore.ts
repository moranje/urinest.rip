import { determineOutcome } from "decision-engine-core";
import {
  createBeslismodelStore,
  type BeslismodelManifestInput,
  type BeslismodelStorageAdapter,
  type BeslismodelStoreErrorContext,
} from "@beslismodel/vue";
import { breadcrumbApi } from "../lib/breadcrumbs";
import { handleError, HttpStatusError, TimeoutError } from "../lib/errors";
import { createSupabaseTelemetryAdapter } from "../lib/framework-telemetry";
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
  Answer,
  OutcomeResult,
} from "../types";

interface RawQuestionnaire {
  id: string;
  version?: string;
  name?: string;
  title: string;
  description?: string;
  category?: string;
  audience?: readonly string[];
  domain?: string;
  icon?: string;
  hiddenFromLandingPage?: boolean;
  recommendedStart?: boolean;
  metadata?: Readonly<Record<string, unknown>>;
  questions?: Question[];
  steps?: Step[];
  results?: Record<string, ResultData>;
  resultsLogic?: Omit<ResultLogicRule, "id">[];
}

interface FetchedData {
  questionnaires?: RawQuestionnaire[];
  metadata?: Readonly<Record<string, unknown>>;
}

const ANSWERS_STORAGE_KEY = appConfig.storage.answersKey;
const ANSWERS_TTL_MS = appConfig.storage.answersTtlMs;

const answersStorage: BeslismodelStorageAdapter = {
  getItem: (key: string): string | null => readStorage("session", key),
  removeItem: (key: string): void => {
    removeStorage("session", key);
  },
  setItem: (key: string, value: string): void => {
    if (!writeStorage("session", key, value)) {
      throw new Error("Questionnaire answer storage unavailable");
    }
  },
};

const questionnaireTelemetry = createSupabaseTelemetryAdapter({ module: "questionnaire-store" });

const fetchManifest = async (): Promise<BeslismodelManifestInput<ResultData>> => {
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

  const data = (await response.json()) as FetchedData;
  return {
    metadata: data.metadata,
    questionnaires: (data.questionnaires ?? []).map((questionnaire) => ({
      id: questionnaire.id,
      version: questionnaire.version,
      name: questionnaire.name,
      title: questionnaire.title,
      description: questionnaire.description,
      category: questionnaire.category,
      audience: questionnaire.audience,
      domain: questionnaire.domain,
      icon: questionnaire.icon,
      hiddenFromLandingPage: questionnaire.hiddenFromLandingPage,
      recommendedStart: questionnaire.recommendedStart,
      metadata: questionnaire.metadata,
      questions: questionnaire.questions ?? [],
      steps: questionnaire.steps ?? [],
      results: questionnaire.results ?? {},
      resultsLogic: questionnaire.resultsLogic ?? [],
    })),
  };
};

const handleStoreError = (error: Error, context: BeslismodelStoreErrorContext): void => {
  switch (context.phase) {
    case "answers.persist":
      handleError(error, "answers:write-storage");
      return;
    case "answers.restore":
      handleError(error, "answers:read-storage");
      return;
    case "conditions.validate":
      handleError(error, "decision-engine:validate-conditions", {
        questionnaireId: context.questionnaireId,
        conditionCount: context.conditionCount,
      });
      return;
    case "outcome.resolve": {
      const roleStore = useRoleStore();
      handleError(error, "decision-engine:determine-outcome", {
        questionnaireId: context.questionnaireId,
        role: roleStore.role,
        logicCount: context.logicCount,
      });
      return;
    }
    case "manifest.load":
      handleError(error, "questionnaire-store:load-initial");
      return;
  }
};

export const useQuestionnaireStore = createBeslismodelStore<
  ResultData,
  Answer,
  QuestionnaireMeta,
  Question,
  Step,
  ResultLogicRule,
  OutcomeResult
>({
  answersStorage,
  answersStorageKey: ANSWERS_STORAGE_KEY,
  answersTtlMs: ANSWERS_TTL_MS,
  contextAliases: { role: "_role" },
  contextProvider: () => {
    const roleStore = useRoleStore();
    return { role: roleStore.role };
  },
  duplicateIdPolicy: "overwrite",
  loadManifest: fetchManifest,
  onError: handleStoreError,
  onManifestLoaded: (_manifest, questionnaires) => {
    persistTelemetry({
      module: "questionnaire-store",
      message: "flow.versions",
      context: {
        flows: Object.values(questionnaires).map((questionnaire) => ({
          id: questionnaire.id,
          version: questionnaire.version,
        })),
        guidelines: guidelineReviews.map((guideline) => ({
          name: guideline.name,
          reviewed: guideline.reviewedIso,
        })),
      },
    });
  },
  outcomeResolver: (answers, logic) => determineOutcome(answers, logic) as OutcomeResult,
  storeId: "questionnaire",
  telemetry: questionnaireTelemetry,
});
