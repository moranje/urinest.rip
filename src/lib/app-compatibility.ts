import type { Component } from "vue";
import { determineOutcome, type NormalizedDecisionManifest } from "@beslismodel/core";
import type {
  BeslismodelManifestInput,
  BeslismodelStorageAdapter,
  BeslismodelStoreErrorContext,
} from "@beslismodel/vue";
import CultureSvg from "../components/CultureSvg.vue";
import DipslideSvg from "../components/DipslideSvg.vue";
import HealthySvg from "../components/HealthySvg.vue";
import SedimentSvg from "../components/SedimentSvg.vue";
import StripSvg from "../components/StripSvg.vue";
import { appConfig } from "../config/app-config";
import { useRoleStore } from "../store/roleStore";
import type {
  Answer,
  OutcomeResult,
  QuestionnaireMeta,
  Question,
  ResultData,
  ResultLogicRule,
  Step,
} from "../types";
import { breadcrumbApi } from "./breadcrumbs";
import { handleError, HttpStatusError, TimeoutError } from "./errors";
import { createSupabaseTelemetryAdapter } from "./framework-telemetry";
import { guidelineReviews } from "./guidelines";
import { persistTelemetry } from "./log-sink";
import { renderMarkdown } from "./markdown-renderer";
import { readStorage, removeStorage, writeStorage } from "./storage";

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

export const questionnaireAnswersStorageKey = appConfig.storage.answersKey;
export const questionnaireAnswersTtlMs = appConfig.storage.answersTtlMs;

export const questionnaireAnswersStorage: BeslismodelStorageAdapter = {
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

export const questionnaireTelemetry = createSupabaseTelemetryAdapter({
  module: "questionnaire-store",
});

export const loadQuestionnaireManifest = async (): Promise<
  BeslismodelManifestInput<ResultData>
> => {
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

export const getQuestionnaireRoleContext = (): { role: string } => {
  const roleStore = useRoleStore();
  return { role: roleStore.role };
};

export const handleQuestionnaireStoreError = (
  error: Error,
  context: BeslismodelStoreErrorContext,
): void => {
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

export const reportQuestionnaireVersions = (
  _manifest: NormalizedDecisionManifest<ResultData>,
  questionnaires: Readonly<Record<string, QuestionnaireMeta>>,
): void => {
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
};

export const resolveQuestionnaireOutcome = (
  answers: Record<string, unknown>,
  logic: readonly ResultLogicRule[],
): OutcomeResult => determineOutcome(answers, logic) as OutcomeResult;

const iconComponents = {
  culture: CultureSvg,
  dipslide: DipslideSvg,
  healthy: HealthySvg,
  sediment: SedimentSvg,
  strip: StripSvg,
} satisfies Record<string, Component>;

type LandingIcon = keyof typeof iconComponents;

export const landingIconKeys = Object.keys(iconComponents);

export const questionnairePath = (id: string): string => `/questionnaire/${id}`;

export const resolveLandingIconComponent = (icon: string | undefined): Component | null =>
  icon && icon in iconComponents ? iconComponents[icon as LandingIcon] : null;

export const renderAppMarkdown = (markdown: string | undefined): string => renderMarkdown(markdown);

export type QuestionnaireStoreAnswer = Answer;
export type QuestionnaireStoreMeta = QuestionnaireMeta;
export type QuestionnaireStoreQuestion = Question;
export type QuestionnaireStoreStep = Step;
export type QuestionnaireStoreResultLogicRule = ResultLogicRule;
export type QuestionnaireStoreOutcomeResult = OutcomeResult;
