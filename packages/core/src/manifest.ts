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
  readonly id: ManifestId;
  readonly conditions: readonly ManifestCondition[];
  readonly actionType: string;
  readonly resultKey?: ManifestId;
  readonly redirectToQuestionnaire?: ManifestId;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ManifestQuestionnaire<ResultData = Readonly<Record<string, unknown>>> {
  readonly id: ManifestId;
  readonly version: string;
  readonly name?: string;
  readonly title: string;
  readonly description?: string;
  readonly icon?: string;
  readonly hiddenFromLandingPage?: boolean;
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
  readonly icon?: string;
  readonly hiddenFromLandingPage?: boolean;
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
  readonly resultsLogic: Readonly<Record<ManifestId, ManifestResultLogicRule>>;
}
