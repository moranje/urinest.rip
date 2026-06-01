export type ManifestId = string;
export type ManifestQuestionType = string;
export type ManifestConditionOperator = string;

export interface ManifestCondition<Value = unknown> {
  readonly questionId: ManifestId;
  readonly operator: ManifestConditionOperator;
  readonly value: Value;
}

export interface ManifestQuestionOption<Value = unknown> {
  readonly id: ManifestId;
  readonly value: Value;
  readonly text: string;
  readonly description?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ManifestQuestion<Value = unknown> {
  readonly id: ManifestId;
  readonly text: string;
  readonly type: ManifestQuestionType;
  readonly options: readonly ManifestQuestionOption<Value>[];
  readonly conditions?: readonly ManifestCondition[];
  readonly description?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ManifestStep {
  readonly id: ManifestId;
  readonly title?: string;
  readonly description?: string;
  readonly questionIds: readonly ManifestId[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ManifestResultLogicRule {
  readonly id?: ManifestId;
  readonly conditions: readonly ManifestCondition[];
  readonly actionType: string;
  readonly resultKey?: ManifestId;
  readonly redirectToQuestionnaire?: ManifestId;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface NormalizedResultLogicRule extends Omit<ManifestResultLogicRule, "id"> {
  readonly id: ManifestId;
}

export interface ManifestQuestionnaire<ResultData = Readonly<Record<string, unknown>>> {
  readonly id: ManifestId;
  readonly version: string;
  readonly name?: string;
  readonly title: string;
  readonly description?: string;
  readonly category?: string;
  readonly audience?: readonly string[];
  readonly domain?: string;
  readonly icon?: string;
  readonly hiddenFromLandingPage?: boolean;
  readonly recommendedStart?: boolean;
  readonly questions?: readonly ManifestQuestion[];
  readonly steps?: readonly ManifestStep[];
  readonly results?: Readonly<Record<ManifestId, ResultData>>;
  readonly resultsLogic?: readonly ManifestResultLogicRule[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface DecisionManifest<ResultData = Readonly<Record<string, unknown>>> {
  readonly questionnaires: readonly ManifestQuestionnaire<ResultData>[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface NormalizedQuestionnaireMeta {
  readonly id: ManifestId;
  readonly version: string;
  readonly name?: string;
  readonly title: string;
  readonly description?: string;
  readonly category?: string;
  readonly audience?: readonly string[];
  readonly domain?: string;
  readonly icon?: string;
  readonly hiddenFromLandingPage?: boolean;
  readonly recommendedStart?: boolean;
  readonly questionIds: readonly ManifestId[];
  readonly stepIds: readonly ManifestId[];
  readonly resultsLogicIds: readonly ManifestId[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface NormalizedDecisionManifest<ResultData = Readonly<Record<string, unknown>>> {
  readonly questionnaires: Readonly<Record<ManifestId, NormalizedQuestionnaireMeta>>;
  readonly questions: Readonly<Record<ManifestId, ManifestQuestion>>;
  readonly steps: Readonly<Record<ManifestId, ManifestStep>>;
  readonly results: Readonly<Record<ManifestId, ResultData>>;
  readonly resultsLogic: Readonly<Record<ManifestId, NormalizedResultLogicRule>>;
}

export type DuplicateManifestIdPolicy = "throw" | "overwrite";

export interface NormalizeDecisionManifestOptions {
  readonly duplicateIdPolicy?: DuplicateManifestIdPolicy;
}

const setNormalizedEntity = <Entity>(
  collectionName: string,
  id: ManifestId,
  entity: Entity,
  collection: Record<ManifestId, Entity>,
  duplicateIdPolicy: DuplicateManifestIdPolicy,
): void => {
  if (duplicateIdPolicy === "throw" && Object.prototype.hasOwnProperty.call(collection, id)) {
    throw new Error(`Duplicate ${collectionName} id: ${id}`);
  }
  collection[id] = entity;
};

const ruleIdFor = (
  questionnaireId: ManifestId,
  rule: ManifestResultLogicRule,
  index: number,
): ManifestId => rule.id || `${questionnaireId}-rule-${index}`;

export function normalizeDecisionManifest<ResultData = Readonly<Record<string, unknown>>>(
  manifest: DecisionManifest<ResultData>,
  options: NormalizeDecisionManifestOptions = {},
): NormalizedDecisionManifest<ResultData> {
  const duplicateIdPolicy = options.duplicateIdPolicy ?? "throw";
  const questionnaires: Record<ManifestId, NormalizedQuestionnaireMeta> = {};
  const questions: Record<ManifestId, ManifestQuestion> = {};
  const steps: Record<ManifestId, ManifestStep> = {};
  const results: Record<ManifestId, ResultData> = {};
  const resultsLogic: Record<ManifestId, NormalizedResultLogicRule> = {};

  for (const questionnaire of manifest.questionnaires) {
    const questionIds: ManifestId[] = [];
    for (const question of questionnaire.questions ?? []) {
      setNormalizedEntity("question", question.id, question, questions, duplicateIdPolicy);
      questionIds.push(question.id);
    }

    const stepIds: ManifestId[] = [];
    for (const step of questionnaire.steps ?? []) {
      setNormalizedEntity("step", step.id, step, steps, duplicateIdPolicy);
      stepIds.push(step.id);
    }

    for (const [key, result] of Object.entries(questionnaire.results ?? {})) {
      setNormalizedEntity("result", key, result, results, duplicateIdPolicy);
    }

    const resultsLogicIds: ManifestId[] = [];
    (questionnaire.resultsLogic ?? []).forEach((rule, index) => {
      const id = ruleIdFor(questionnaire.id, rule, index);
      setNormalizedEntity("result logic", id, { ...rule, id }, resultsLogic, duplicateIdPolicy);
      resultsLogicIds.push(id);
    });

    setNormalizedEntity(
      "questionnaire",
      questionnaire.id,
      {
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
        questionIds,
        stepIds,
        resultsLogicIds,
        metadata: questionnaire.metadata,
      },
      questionnaires,
      duplicateIdPolicy,
    );
  }

  return Object.freeze({
    questionnaires: Object.freeze(questionnaires),
    questions: Object.freeze(questions),
    steps: Object.freeze(steps),
    results: Object.freeze(results),
    resultsLogic: Object.freeze(resultsLogic),
  });
}
