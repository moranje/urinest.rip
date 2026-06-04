import type {
  CalculatorSourceReference,
  CalculatorTestVector,
  VerifiedCalculatorDefinition,
} from "@beslismodel/core";

export type GoldAbeGroup = "A" | "B" | "E";
export type CopdSymptomBurden = "lower" | "higher";
export type CopdExacerbationRisk = "lower" | "elevated";

export interface GoldAbeInput {
  readonly moderateExacerbationsPastYear: number;
  readonly severeExacerbationsPastYear: number;
  readonly catScore?: number;
  readonly mmrcGrade?: number;
}

export interface GoldAbeResult {
  readonly group: GoldAbeGroup;
  readonly symptomBurden: CopdSymptomBurden;
  readonly exacerbationRisk: CopdExacerbationRisk;
  readonly formulaVersion: string;
  readonly sourceReferenceIds: readonly string[];
}

export type GoldAbeExpected = Pick<GoldAbeResult, "group" | "symptomBurden" | "exacerbationRisk">;

const FORMULA_VERSION = "gold-2026-abe-thresholds";
const SOURCE_REFERENCE_IDS = ["gold-2026-report", "gold-2026-key-changes"] as const;

export const goldAbeSourceReferences: readonly CalculatorSourceReference[] = Object.freeze([
  {
    id: "gold-2026-report",
    title: "GOLD 2026 Report: Global Strategy for Prevention, Diagnosis and Management of COPD",
    url: "https://goldcopd.org/2026-gold-report-and-pocket-guide/",
    version: "GOLD 2026 Report page, accessed 2026-06-03",
    retrieved: "2026-06-03",
  },
  {
    id: "gold-2026-key-changes",
    title: "GOLD Report 2026 Key Changes Summary",
    url: "https://goldcopd.org/wp-content/uploads/2025/11/KEY-CHANGES-GOLD-2026-10Nov2025.pdf",
    version: "GOLD 2026 key changes, 10 Nov 2025",
    retrieved: "2026-06-03",
  },
]);

export const goldAbeTestVectors: readonly CalculatorTestVector<GoldAbeInput, GoldAbeExpected>[] =
  Object.freeze([
    {
      id: "gold-abe-a-low-symptoms-no-exacerbation",
      input: { moderateExacerbationsPastYear: 0, severeExacerbationsPastYear: 0, catScore: 8 },
      expected: { group: "A", symptomBurden: "lower", exacerbationRisk: "lower" },
      sourceReferenceId: "gold-2026-report",
    },
    {
      id: "gold-abe-b-cat-symptoms-no-exacerbation",
      input: { moderateExacerbationsPastYear: 0, severeExacerbationsPastYear: 0, catScore: 12 },
      expected: { group: "B", symptomBurden: "higher", exacerbationRisk: "lower" },
      sourceReferenceId: "gold-2026-report",
    },
    {
      id: "gold-abe-b-mmrc-symptoms-no-exacerbation",
      input: { moderateExacerbationsPastYear: 0, severeExacerbationsPastYear: 0, mmrcGrade: 2 },
      expected: { group: "B", symptomBurden: "higher", exacerbationRisk: "lower" },
      sourceReferenceId: "gold-2026-report",
    },
    {
      id: "gold-abe-e-one-moderate-exacerbation",
      input: { moderateExacerbationsPastYear: 1, severeExacerbationsPastYear: 0, catScore: 4 },
      expected: { group: "E", symptomBurden: "lower", exacerbationRisk: "elevated" },
      sourceReferenceId: "gold-2026-key-changes",
    },
    {
      id: "gold-abe-e-one-severe-exacerbation",
      input: { moderateExacerbationsPastYear: 0, severeExacerbationsPastYear: 1, catScore: 4 },
      expected: { group: "E", symptomBurden: "lower", exacerbationRisk: "elevated" },
      sourceReferenceId: "gold-2026-key-changes",
    },
  ]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNonNegativeInteger = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0;

export const validateGoldAbeInput = (input: unknown): input is GoldAbeInput => {
  if (!isRecord(input)) return false;
  if (!isNonNegativeInteger(input.moderateExacerbationsPastYear)) return false;
  if (!isNonNegativeInteger(input.severeExacerbationsPastYear)) return false;
  if (input.catScore !== undefined && !isFiniteNumber(input.catScore)) return false;
  if (input.mmrcGrade !== undefined && !isFiniteNumber(input.mmrcGrade)) return false;
  return true;
};

const assertGoldAbeInput = (input: GoldAbeInput): void => {
  if (input.catScore === undefined && input.mmrcGrade === undefined) {
    throw new Error("GOLD ABE classification requires CAT score or mMRC grade.");
  }
  if (input.catScore !== undefined && (input.catScore < 0 || input.catScore > 40)) {
    throw new Error("CAT score must be between 0 and 40.");
  }
  if (input.mmrcGrade !== undefined && (input.mmrcGrade < 0 || input.mmrcGrade > 4)) {
    throw new Error("mMRC grade must be between 0 and 4.");
  }
};

export const classifyGoldAbe = (input: GoldAbeInput): GoldAbeResult => {
  assertGoldAbeInput(input);

  const symptomBurden =
    (input.catScore !== undefined && input.catScore >= 10) ||
    (input.mmrcGrade !== undefined && input.mmrcGrade >= 2)
      ? "higher"
      : "lower";
  const exacerbationRisk =
    input.moderateExacerbationsPastYear >= 1 || input.severeExacerbationsPastYear >= 1
      ? "elevated"
      : "lower";
  const group: GoldAbeGroup =
    exacerbationRisk === "elevated" ? "E" : symptomBurden === "higher" ? "B" : "A";

  return Object.freeze({
    group,
    symptomBurden,
    exacerbationRisk,
    formulaVersion: FORMULA_VERSION,
    sourceReferenceIds: SOURCE_REFERENCE_IDS,
  });
};

export const goldAbeCalculator = Object.freeze({
  id: "copd.gold_abe",
  version: "0.1.0",
  label: "GOLD COPD ABE classification",
  formulaVersion: FORMULA_VERSION,
  sourceReferences: goldAbeSourceReferences,
  testVectors: goldAbeTestVectors,
  verificationStatus: "verified",
  validateInput: validateGoldAbeInput,
  calculate: (input: GoldAbeInput) => classifyGoldAbe(input),
} satisfies VerifiedCalculatorDefinition<GoldAbeInput, GoldAbeResult, GoldAbeExpected>);
