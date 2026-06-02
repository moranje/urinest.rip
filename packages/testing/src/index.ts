import {
  normalizeDecisionManifest,
  parseOutcome,
  type DecisionManifest,
  type ManifestCondition,
  type ManifestQuestionnaire,
  type NormalizedDecisionManifest,
  type TypedOutcome,
} from "@beslismodel/core";

export type StableSnapshotValue =
  | null
  | string
  | number
  | boolean
  | readonly StableSnapshotValue[]
  | { readonly [key: string]: StableSnapshotValue };

export interface ManifestSnapshotQuestionnaire {
  readonly id: string;
  readonly version: string;
  readonly title: string;
  readonly name?: string;
  readonly category?: string;
  readonly domain?: string;
  readonly audience?: readonly string[];
  readonly questionIds: readonly string[];
  readonly stepIds: readonly string[];
  readonly resultKeys: readonly string[];
  readonly redirects: readonly string[];
  readonly resultRules: readonly {
    readonly id: string;
    readonly actionType: string;
    readonly resultKey?: string;
    readonly redirectToQuestionnaire?: string;
    readonly conditionCount: number;
    readonly conditions: readonly ManifestCondition[];
  }[];
}

export interface ManifestSnapshot {
  readonly questionnaireIds: readonly string[];
  readonly questionnaires: readonly ManifestSnapshotQuestionnaire[];
  readonly metadata?: StableSnapshotValue;
}

export type ClinicalSafetyExpectedOutcome =
  | { readonly type: "result"; readonly key: string }
  | { readonly type: "redirect"; readonly target: string }
  | { readonly type: "none" };

export interface ClinicalSafetyFixture<
  Answers extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
> {
  readonly id: string;
  readonly questionnaireId: string;
  readonly description?: string;
  readonly role?: string;
  readonly answers: Answers;
  readonly expectedOutcome: ClinicalSafetyExpectedOutcome;
  readonly requiredAnsweredQuestionIds?: readonly string[];
  readonly forbiddenAnsweredQuestionIds?: readonly string[];
  readonly tags?: readonly string[];
}

export type ClinicalSafetyRawOutcome =
  | string
  | null
  | undefined
  | { readonly outcome?: string | null | undefined };

export type ClinicalSafetyOutcomeResolver<
  Answers extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
> = (fixture: ClinicalSafetyFixture<Answers>) => ClinicalSafetyRawOutcome;

export interface ClinicalSafetyFixtureFailure {
  readonly fixtureId: string;
  readonly message: string;
  readonly expected?: StableSnapshotValue;
  readonly actual?: StableSnapshotValue;
}

export interface ClinicalSafetyFixtureResult<
  Answers extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
> {
  readonly fixture: ClinicalSafetyFixture<Answers>;
  readonly outcome: TypedOutcome;
  readonly failures: readonly ClinicalSafetyFixtureFailure[];
  readonly passed: boolean;
}

export interface RoleContextMatrixCase<
  Context extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
  Expected = unknown,
> {
  readonly id: string;
  readonly context: Context;
  readonly expected: Expected;
  readonly description?: string;
  readonly tags?: readonly string[];
}

export type RoleContextMatrixRunner<
  Context extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
  Actual = unknown,
  Expected = unknown,
> = (matrixCase: RoleContextMatrixCase<Context, Expected>) => Actual;

export interface RoleContextMatrixFailure {
  readonly caseId: string;
  readonly message: string;
  readonly expected?: StableSnapshotValue;
  readonly actual?: StableSnapshotValue;
}

export interface RoleContextMatrixResult<
  Context extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
  Actual = unknown,
  Expected = unknown,
> {
  readonly case: RoleContextMatrixCase<Context, Expected>;
  readonly actual: Actual;
  readonly failures: readonly RoleContextMatrixFailure[];
  readonly passed: boolean;
}

export interface RoleContextMatrixOptions<Actual = unknown, Expected = unknown> {
  readonly compare?: (actual: Actual, expected: Expected) => boolean;
  readonly failureMessage?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNormalizedDecisionManifest = (
  manifest: DecisionManifest | NormalizedDecisionManifest,
): manifest is NormalizedDecisionManifest =>
  !Array.isArray((manifest as DecisionManifest).questionnaires);

const stableValue = (value: unknown): StableSnapshotValue => {
  if (value === undefined) return null;
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (Array.isArray(value)) return value.map((entry) => stableValue(entry));
  if (!isRecord(value)) return String(value);

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableValue(value[key])]),
  );
};

const normalizeRawManifest = (
  manifest: DecisionManifest | NormalizedDecisionManifest,
): NormalizedDecisionManifest => {
  if (isNormalizedDecisionManifest(manifest)) {
    return manifest;
  }
  return normalizeDecisionManifest(manifest);
};

const questionnaireSnapshot = (
  questionnaire: ManifestQuestionnaire,
): ManifestSnapshotQuestionnaire => {
  const resultsLogic = questionnaire.resultsLogic ?? [];
  return {
    audience: questionnaire.audience ? [...questionnaire.audience].sort() : undefined,
    category: questionnaire.category,
    domain: questionnaire.domain,
    id: questionnaire.id,
    name: questionnaire.name,
    questionIds: (questionnaire.questions ?? []).map((question) => question.id).sort(),
    redirects: [
      ...new Set(
        resultsLogic
          .map((rule) => rule.redirectToQuestionnaire)
          .filter((target): target is string => typeof target === "string" && target.length > 0),
      ),
    ].sort(),
    resultKeys: Object.keys(questionnaire.results ?? {}).sort(),
    resultRules: resultsLogic
      .map((rule, index) => ({
        actionType: rule.actionType,
        conditionCount: rule.conditions.length,
        conditions: [...rule.conditions].sort((a, b) => a.questionId.localeCompare(b.questionId)),
        id: rule.id ?? `${questionnaire.id}-rule-${index}`,
        redirectToQuestionnaire: rule.redirectToQuestionnaire,
        resultKey: rule.resultKey,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    stepIds: (questionnaire.steps ?? []).map((step) => step.id).sort(),
    title: questionnaire.title,
    version: questionnaire.version,
  };
};

export const createStableSnapshot = <Value>(value: Value): StableSnapshotValue =>
  stableValue(value);

export const createManifestSnapshot = (manifest: DecisionManifest): ManifestSnapshot => {
  const questionnaires = [...manifest.questionnaires]
    .map((questionnaire) => questionnaireSnapshot(questionnaire))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    metadata: manifest.metadata ? stableValue(manifest.metadata) : undefined,
    questionnaireIds: questionnaires.map((questionnaire) => questionnaire.id),
    questionnaires,
  };
};

export const createNormalizedManifestSnapshot = (
  manifest: DecisionManifest | NormalizedDecisionManifest,
): StableSnapshotValue => stableValue(normalizeRawManifest(manifest));

const rawOutcomeValue = (outcome: ClinicalSafetyRawOutcome): string | null | undefined =>
  isRecord(outcome) ? (outcome.outcome as string | null | undefined) : outcome;

const outcomeMatches = (actual: TypedOutcome, expected: ClinicalSafetyExpectedOutcome): boolean => {
  if (expected.type === "none") return actual.type === "none";
  if (expected.type === "result") return actual.type === "result" && actual.key === expected.key;
  return actual.type === "redirect" && actual.target === expected.target;
};

const expectedSnapshot = (expected: ClinicalSafetyExpectedOutcome): StableSnapshotValue =>
  stableValue(expected);

const actualSnapshot = (actual: TypedOutcome): StableSnapshotValue => stableValue(actual);

const snapshotsEqual = (actual: unknown, expected: unknown): boolean =>
  JSON.stringify(stableValue(actual)) === JSON.stringify(stableValue(expected));

export const evaluateClinicalSafetyFixtures = <
  Answers extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
>(
  fixtures: readonly ClinicalSafetyFixture<Answers>[],
  resolveOutcome: ClinicalSafetyOutcomeResolver<Answers>,
): readonly ClinicalSafetyFixtureResult<Answers>[] =>
  fixtures.map((fixture) => {
    const outcome = parseOutcome(rawOutcomeValue(resolveOutcome(fixture)));
    const failures: ClinicalSafetyFixtureFailure[] = [];

    if (!outcomeMatches(outcome, fixture.expectedOutcome)) {
      failures.push({
        actual: actualSnapshot(outcome),
        expected: expectedSnapshot(fixture.expectedOutcome),
        fixtureId: fixture.id,
        message: "Unexpected clinical safety outcome.",
      });
    }

    for (const questionId of fixture.requiredAnsweredQuestionIds ?? []) {
      if (!(questionId in fixture.answers)) {
        failures.push({
          actual: stableValue(Object.keys(fixture.answers).sort()),
          expected: stableValue(questionId),
          fixtureId: fixture.id,
          message: `Required answered question missing: ${questionId}.`,
        });
      }
    }

    for (const questionId of fixture.forbiddenAnsweredQuestionIds ?? []) {
      if (questionId in fixture.answers) {
        failures.push({
          actual: stableValue(questionId),
          fixtureId: fixture.id,
          message: `Forbidden answered question present: ${questionId}.`,
        });
      }
    }

    return {
      failures,
      fixture,
      outcome,
      passed: failures.length === 0,
    };
  });

export const assertClinicalSafetyFixtures = <
  Answers extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
>(
  fixtures: readonly ClinicalSafetyFixture<Answers>[],
  resolveOutcome: ClinicalSafetyOutcomeResolver<Answers>,
): readonly ClinicalSafetyFixtureResult<Answers>[] => {
  const results = evaluateClinicalSafetyFixtures(fixtures, resolveOutcome);
  const failures = results.flatMap((result) => result.failures);
  if (failures.length > 0) {
    throw new Error(
      [
        "Clinical safety fixture check failed:",
        ...failures.map((failure) => `- ${failure.fixtureId}: ${failure.message}`),
      ].join("\n"),
    );
  }
  return results;
};

export const evaluateRoleContextMatrix = <
  Context extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
  Actual = unknown,
  Expected = Actual,
>(
  cases: readonly RoleContextMatrixCase<Context, Expected>[],
  runCase: RoleContextMatrixRunner<Context, Actual, Expected>,
  options: RoleContextMatrixOptions<Actual, Expected> = {},
): readonly RoleContextMatrixResult<Context, Actual, Expected>[] =>
  cases.map((matrixCase) => {
    const actual = runCase(matrixCase);
    const compare = options.compare ?? snapshotsEqual;
    const failures: RoleContextMatrixFailure[] = [];

    if (!compare(actual, matrixCase.expected)) {
      failures.push({
        actual: stableValue(actual),
        caseId: matrixCase.id,
        expected: stableValue(matrixCase.expected),
        message: options.failureMessage ?? "Unexpected role/context matrix output.",
      });
    }

    return {
      actual,
      case: matrixCase,
      failures,
      passed: failures.length === 0,
    };
  });

export const assertRoleContextMatrix = <
  Context extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
  Actual = unknown,
  Expected = Actual,
>(
  cases: readonly RoleContextMatrixCase<Context, Expected>[],
  runCase: RoleContextMatrixRunner<Context, Actual, Expected>,
  options: RoleContextMatrixOptions<Actual, Expected> = {},
): readonly RoleContextMatrixResult<Context, Actual, Expected>[] => {
  const results = evaluateRoleContextMatrix(cases, runCase, options);
  const failures = results.flatMap((result) => result.failures);
  if (failures.length > 0) {
    throw new Error(
      [
        "Role/context matrix check failed:",
        ...failures.map((failure) => `- ${failure.caseId}: ${failure.message}`),
      ].join("\n"),
    );
  }
  return results;
};
