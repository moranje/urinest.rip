import { validateConditions, type ConditionAnswers } from "./conditions";
import {
  applyRuntimeContext,
  type RuntimeContext,
  type RuntimeContextValues,
} from "./runtime-context";
import type {
  ManifestId,
  ManifestQuestion,
  ManifestResultLogicRule,
  ManifestStep,
} from "./manifest";

export interface QuestionTraversalQuestionnaire {
  readonly questions?: readonly ManifestQuestion[];
  readonly steps?: readonly ManifestStep[];
}

export interface FindNextQuestionInput {
  readonly questionnaire: QuestionTraversalQuestionnaire | null | undefined;
  readonly answers?: ConditionAnswers;
  readonly startQuestionId?: ManifestId | null;
  readonly runtimeContext?: RuntimeContext | RuntimeContextValues;
  readonly contextAliases?: Readonly<Record<string, string>>;
}

export interface QuestionNode {
  readonly type: "question";
  readonly questionId: ManifestId;
  readonly stepId?: ManifestId;
  readonly question: ManifestQuestion;
}

export interface RedirectCycleResult {
  readonly hasCycle: boolean;
  readonly chain: readonly ManifestId[];
}

export interface RedirectTrail {
  readonly flows: readonly ManifestId[];
  readonly updatedAt: number;
}

export type RedirectTrailAppendResult =
  | { readonly type: "ok"; readonly trail: RedirectTrail }
  | {
      readonly type: "cycle";
      readonly trail: RedirectTrail;
      readonly cycle: readonly ManifestId[];
    };

export interface NormalizeRedirectTrailOptions {
  readonly now?: number;
  readonly ttlMs?: number;
}

export interface QuestionnaireGraph {
  readonly questionIds: readonly ManifestId[];
  readonly stepIds: readonly ManifestId[];
  readonly resultKeys: readonly ManifestId[];
  readonly redirectTargets: readonly ManifestId[];
}

export interface QuestionnaireGraphInput {
  readonly questions?: readonly ManifestQuestion[];
  readonly steps?: readonly ManifestStep[];
  readonly results?: Readonly<Record<ManifestId, unknown>>;
  readonly resultsLogic?: readonly ManifestResultLogicRule[];
}

export function getQuestionnaireQuestionOrder(
  questionnaire: QuestionTraversalQuestionnaire | null | undefined,
): readonly ManifestId[] {
  if (!questionnaire) return [];

  const stepQuestionIds = (questionnaire.steps ?? []).flatMap((step) => [...step.questionIds]);
  if (stepQuestionIds.length > 0) return stepQuestionIds;

  return (questionnaire.questions ?? []).map((question) => question.id);
}

export function findNextQuestionId({
  questionnaire,
  answers = {},
  startQuestionId = null,
  runtimeContext,
  contextAliases,
}: FindNextQuestionInput): ManifestId | null {
  return (
    findNextQuestion({
      questionnaire,
      answers,
      startQuestionId,
      runtimeContext,
      contextAliases,
    })?.questionId ?? null
  );
}

export function findNextQuestion({
  questionnaire,
  answers = {},
  startQuestionId = null,
  runtimeContext,
  contextAliases,
}: FindNextQuestionInput): QuestionNode | null {
  if (!questionnaire) return null;

  const questionsById = new Map(
    (questionnaire.questions ?? []).map((question) => [question.id, question]),
  );
  const stepIdByQuestionId = new Map<ManifestId, ManifestId>();
  for (const step of questionnaire.steps ?? []) {
    for (const questionId of step.questionIds) {
      stepIdByQuestionId.set(questionId, step.id);
    }
  }
  const resolvedAnswers = runtimeContext
    ? applyRuntimeContext(answers, runtimeContext, { aliases: contextAliases })
    : answers;
  let searching = !startQuestionId;

  for (const questionId of getQuestionnaireQuestionOrder(questionnaire)) {
    if (!searching) {
      searching = questionId === startQuestionId;
      continue;
    }

    const question = questionsById.get(questionId);
    if (!question) continue;
    if (validateConditions(resolvedAnswers, question.conditions ?? []).isValid) {
      return {
        type: "question",
        questionId,
        stepId: stepIdByQuestionId.get(questionId),
        question,
      };
    }
  }

  return null;
}

export function detectRedirectCycle(
  redirectChain: readonly ManifestId[],
  targetQuestionnaireId: ManifestId,
): RedirectCycleResult {
  const chain = [...redirectChain, targetQuestionnaireId];
  return {
    hasCycle: redirectChain.includes(targetQuestionnaireId),
    chain,
  };
}

export function normalizeRedirectTrail(
  trail: RedirectTrail | null | undefined,
  currentQuestionnaireId: ManifestId,
  options: NormalizeRedirectTrailOptions = {},
): RedirectTrail {
  const now = options.now ?? 0;
  const ttlMs = options.ttlMs ?? Number.POSITIVE_INFINITY;
  if (!trail || !Array.isArray(trail.flows) || now - trail.updatedAt > ttlMs) {
    return { flows: [currentQuestionnaireId], updatedAt: now };
  }

  const currentIndex = trail.flows.indexOf(currentQuestionnaireId);
  return {
    flows: currentIndex >= 0 ? trail.flows.slice(0, currentIndex + 1) : [currentQuestionnaireId],
    updatedAt: trail.updatedAt,
  };
}

export function appendRedirectTrail(
  trail: RedirectTrail,
  targetQuestionnaireId: ManifestId,
  options: { now?: number } = {},
): RedirectTrailAppendResult {
  const cycle = detectRedirectCycle(trail.flows, targetQuestionnaireId);
  const nextTrail = { flows: cycle.chain, updatedAt: options.now ?? trail.updatedAt };
  if (cycle.hasCycle) {
    return { type: "cycle", trail: nextTrail, cycle: cycle.chain };
  }
  return { type: "ok", trail: nextTrail };
}

export function describeQuestionnaireGraph(input: QuestionnaireGraphInput): QuestionnaireGraph {
  return {
    questionIds: getQuestionnaireQuestionOrder(input),
    stepIds: (input.steps ?? []).map((step) => step.id),
    resultKeys: Object.keys(input.results ?? {}),
    redirectTargets: (input.resultsLogic ?? [])
      .map((rule) => rule.redirectToQuestionnaire)
      .filter((target): target is ManifestId => typeof target === "string" && target.length > 0),
  };
}
