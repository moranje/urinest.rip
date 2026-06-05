import { createBeslismodelStore } from "@moranje/beslismodel/vue";
import {
  getQuestionnaireRoleContext,
  handleQuestionnaireStoreError,
  loadQuestionnaireManifest,
  questionnaireAnswersStorage,
  questionnaireAnswersStorageKey,
  questionnaireAnswersTtlMs,
  questionnaireTelemetry,
  reportQuestionnaireVersions,
  resolveQuestionnaireOutcome,
} from "../lib/app-compatibility";
import type {
  QuestionnaireMeta,
  Question,
  Step,
  ResultLogicRule,
  ResultData,
  Answer,
  OutcomeResult,
} from "../types";

export const useQuestionnaireStore = createBeslismodelStore<
  ResultData,
  Answer,
  QuestionnaireMeta,
  Question,
  Step,
  ResultLogicRule,
  OutcomeResult
>({
  answersStorage: questionnaireAnswersStorage,
  answersStorageKey: questionnaireAnswersStorageKey,
  answersTtlMs: questionnaireAnswersTtlMs,
  contextAliases: { role: "_role" },
  contextProvider: getQuestionnaireRoleContext,
  duplicateIdPolicy: "overwrite",
  loadManifest: loadQuestionnaireManifest,
  onError: handleQuestionnaireStoreError,
  onManifestLoaded: reportQuestionnaireVersions,
  outcomeResolver: resolveQuestionnaireOutcome,
  storeId: "questionnaire",
  telemetry: questionnaireTelemetry,
});
