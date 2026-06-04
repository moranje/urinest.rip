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

export interface GuidelineEvidenceNode {
  readonly claim: string;
  readonly verdict: string;
  readonly sourceIds: readonly string[];
}

export interface GuidelineQuestionTraceability extends GuidelineEvidenceNode {
  readonly optionValues: readonly string[];
  readonly optionClaims?: Readonly<Record<string, GuidelineEvidenceNode>>;
}

export interface GuidelineResultGroupTraceability extends GuidelineEvidenceNode {
  readonly id: string;
  readonly keys: readonly string[];
}

export interface GuidelineFlowTraceability extends GuidelineEvidenceNode {
  readonly questions: Readonly<Record<string, GuidelineQuestionTraceability>>;
  readonly results?: Readonly<Record<string, GuidelineEvidenceNode>>;
  readonly resultGroups?: readonly GuidelineResultGroupTraceability[];
  readonly redirects?: Readonly<Record<string, GuidelineEvidenceNode>>;
}

export interface GuidelineTraceabilityMatrix {
  readonly sources: Readonly<Record<string, unknown>>;
  readonly flows: Readonly<Record<string, GuidelineFlowTraceability>>;
  readonly optionDefenseRequiredForFlows?: readonly string[];
  readonly allowedVerdicts?: readonly string[];
}

export interface GuidelineTraceabilityFailure {
  readonly path: string;
  readonly message: string;
  readonly expected?: StableSnapshotValue;
  readonly actual?: StableSnapshotValue;
}

export interface GuidelineTraceabilityResult {
  readonly failures: readonly GuidelineTraceabilityFailure[];
  readonly passed: boolean;
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

const sorted = (values: Iterable<string>): readonly string[] => [...values].sort();

const arraysMatch = (actual: readonly string[], expected: readonly string[]): boolean =>
  JSON.stringify(actual) === JSON.stringify(expected);

const addTraceabilityFailure = (
  failures: GuidelineTraceabilityFailure[],
  path: string,
  message: string,
  expected?: unknown,
  actual?: unknown,
): void => {
  failures.push({
    actual: actual === undefined ? undefined : stableValue(actual),
    expected: expected === undefined ? undefined : stableValue(expected),
    message,
    path,
  });
};

const validateGuidelineEvidenceNode = (
  node: GuidelineEvidenceNode | undefined,
  path: string,
  sourceIds: ReadonlySet<string>,
  allowedVerdicts: ReadonlySet<string>,
  failures: GuidelineTraceabilityFailure[],
): void => {
  if (!node || typeof node !== "object") {
    addTraceabilityFailure(failures, path, "Missing evidence node.");
    return;
  }
  if (!node.claim || typeof node.claim !== "string") {
    addTraceabilityFailure(failures, path, "Missing claim.");
  }
  if (!allowedVerdicts.has(node.verdict)) {
    addTraceabilityFailure(failures, path, `Unsupported verdict: ${node.verdict}.`);
  }
  if (!Array.isArray(node.sourceIds) || node.sourceIds.length === 0) {
    addTraceabilityFailure(failures, path, "sourceIds must be a non-empty array.");
    return;
  }
  for (const sourceId of node.sourceIds) {
    if (!sourceIds.has(sourceId)) {
      addTraceabilityFailure(failures, path, `Unknown sourceId: ${sourceId}.`);
    }
  }
};

const assertSameStringArray = (
  failures: GuidelineTraceabilityFailure[],
  path: string,
  actual: readonly string[],
  expected: readonly string[],
): void => {
  if (!arraysMatch(actual, expected)) {
    addTraceabilityFailure(failures, path, "Unexpected coverage.", expected, actual);
  }
};

export const evaluateGuidelineTraceability = (
  manifest: DecisionManifest,
  traceability: GuidelineTraceabilityMatrix,
): GuidelineTraceabilityResult => {
  const failures: GuidelineTraceabilityFailure[] = [];
  const sourceIds = new Set(Object.keys(traceability.sources ?? {}));
  const allowedVerdicts = new Set(
    traceability.allowedVerdicts ?? ["supported", "scope-guard", "safety-note"],
  );
  const optionDefenseRequiredForFlows = new Set(traceability.optionDefenseRequiredForFlows ?? []);
  const flowIds = new Set((manifest.questionnaires ?? []).map((questionnaire) => questionnaire.id));

  if (sourceIds.size === 0) {
    addTraceabilityFailure(failures, "sources", "No sources configured.");
  }

  for (const flowId of optionDefenseRequiredForFlows) {
    if (!flowIds.has(flowId)) {
      addTraceabilityFailure(failures, "optionDefenseRequiredForFlows", `Unknown flow: ${flowId}.`);
    }
  }

  assertSameStringArray(
    failures,
    "flows",
    sorted(flowIds),
    sorted(Object.keys(traceability.flows)),
  );

  for (const questionnaire of manifest.questionnaires ?? []) {
    const path = `flows.${questionnaire.id}`;
    const flowTrace = traceability.flows[questionnaire.id];
    validateGuidelineEvidenceNode(flowTrace, path, sourceIds, allowedVerdicts, failures);
    if (!flowTrace) continue;

    const actualQuestionIds = sorted(
      (questionnaire.questions ?? []).map((question) => question.id),
    );
    assertSameStringArray(
      failures,
      `${path}.questions`,
      actualQuestionIds,
      sorted(Object.keys(flowTrace.questions ?? {})),
    );

    for (const question of questionnaire.questions ?? []) {
      const questionPath = `${path}.questions.${question.id}`;
      const questionTrace = flowTrace.questions?.[question.id];
      validateGuidelineEvidenceNode(
        questionTrace,
        questionPath,
        sourceIds,
        allowedVerdicts,
        failures,
      );
      if (!questionTrace) continue;

      const actualOptionValues = (question.options ?? []).map((option) => String(option.value));
      assertSameStringArray(
        failures,
        `${questionPath}.optionValues`,
        actualOptionValues,
        questionTrace.optionValues,
      );

      if (optionDefenseRequiredForFlows.has(questionnaire.id)) {
        assertSameStringArray(
          failures,
          `${questionPath}.optionClaims`,
          sorted(actualOptionValues),
          sorted(Object.keys(questionTrace.optionClaims ?? {})),
        );
        for (const optionValue of actualOptionValues) {
          validateGuidelineEvidenceNode(
            questionTrace.optionClaims?.[optionValue],
            `${questionPath}.optionClaims.${optionValue}`,
            sourceIds,
            allowedVerdicts,
            failures,
          );
        }
      }
    }

    const actualResultKeys = sorted(Object.keys(questionnaire.results ?? {}));
    const coveredResultKeys = new Set<string>();
    for (const [resultKey, resultTrace] of Object.entries(flowTrace.results ?? {})) {
      if (!(resultKey in (questionnaire.results ?? {}))) {
        addTraceabilityFailure(failures, `${path}.results.${resultKey}`, "Result does not exist.");
      }
      coveredResultKeys.add(resultKey);
      validateGuidelineEvidenceNode(
        resultTrace,
        `${path}.results.${resultKey}`,
        sourceIds,
        allowedVerdicts,
        failures,
      );
    }

    for (const group of flowTrace.resultGroups ?? []) {
      validateGuidelineEvidenceNode(
        group,
        `${path}.resultGroups.${group.id}`,
        sourceIds,
        allowedVerdicts,
        failures,
      );
      for (const resultKey of group.keys ?? []) {
        if (!(resultKey in (questionnaire.results ?? {}))) {
          addTraceabilityFailure(
            failures,
            `${path}.resultGroups.${group.id}`,
            `Result does not exist: ${resultKey}.`,
          );
        }
        if (coveredResultKeys.has(resultKey)) {
          addTraceabilityFailure(
            failures,
            `${path}.resultGroups.${group.id}`,
            `Duplicate result coverage: ${resultKey}.`,
          );
        }
        coveredResultKeys.add(resultKey);
      }
    }

    assertSameStringArray(
      failures,
      `${path}.result coverage`,
      actualResultKeys,
      sorted(coveredResultKeys),
    );

    const redirectTargets = sorted(
      new Set(
        (questionnaire.resultsLogic ?? [])
          .map((rule) => rule.redirectToQuestionnaire)
          .filter((target): target is string => typeof target === "string" && target.length > 0),
      ),
    );
    assertSameStringArray(
      failures,
      `${path}.redirects`,
      redirectTargets,
      sorted(Object.keys(flowTrace.redirects ?? {})),
    );
    for (const target of redirectTargets) {
      if (!flowIds.has(target)) {
        addTraceabilityFailure(failures, `${path}.redirects.${target}`, "Target flow not found.");
      }
      validateGuidelineEvidenceNode(
        flowTrace.redirects?.[target],
        `${path}.redirects.${target}`,
        sourceIds,
        allowedVerdicts,
        failures,
      );
    }
  }

  return {
    failures,
    passed: failures.length === 0,
  };
};

export const assertGuidelineTraceability = (
  manifest: DecisionManifest,
  traceability: GuidelineTraceabilityMatrix,
): GuidelineTraceabilityResult => {
  const result = evaluateGuidelineTraceability(manifest, traceability);
  if (result.failures.length > 0) {
    throw new Error(
      [
        "Guideline traceability check failed:",
        ...result.failures.map((failure) => `- ${failure.path}: ${failure.message}`),
      ].join("\n"),
    );
  }
  return result;
};

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
