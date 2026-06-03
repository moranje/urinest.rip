import type {
  CalculatorSourceReference,
  CalculatorTestVector,
  VerifiedCalculatorDefinition,
} from "@beslismodel/core";

export type Hba1cUnit = "ifcc_mmol_mol" | "ngsp_percent";

export interface Hba1cConversionInput {
  readonly value: number;
  readonly unit: Hba1cUnit;
  readonly precision?: {
    readonly ifccMmolMol?: number;
    readonly ngspPercent?: number;
    readonly eAgMgDl?: number;
    readonly eAgMmolL?: number;
  };
}

export interface Hba1cConversionResult {
  readonly ifccMmolMol: number;
  readonly ngspPercent: number;
  readonly eAgMgDl: number;
  readonly eAgMmolL: number;
  readonly formulaVersion: string;
  readonly sourceReferenceIds: readonly string[];
}

export type Hba1cConversionExpected = Pick<
  Hba1cConversionResult,
  "ifccMmolMol" | "ngspPercent" | "eAgMgDl" | "eAgMmolL"
>;

const FORMULA_VERSION = "ngsp-ifcc-master-equation-adag-2008";
const SOURCE_REFERENCE_IDS = ["ngsp-ifcc-standardization"] as const;
const GLUCOSE_MG_DL_PER_MMOL_L = 18.0182;

const defaultPrecision = Object.freeze({
  ifccMmolMol: 0,
  ngspPercent: 1,
  eAgMgDl: 0,
  eAgMmolL: 1,
});

export const hba1cSourceReferences: readonly CalculatorSourceReference[] = Object.freeze([
  {
    id: "ngsp-ifcc-standardization",
    title: "NGSP Harmonizing Hemoglobin A1c Testing: IFCC standardization",
    url: "https://ngsp.org/docs/IFCCstd.pdf",
    version: "NGSP IFCC standardization PDF, accessed 2026-06-03",
    retrieved: "2026-06-03",
  },
]);

export const hba1cTestVectors: readonly CalculatorTestVector<
  Hba1cConversionInput,
  Hba1cConversionExpected
>[] = Object.freeze([
  {
    id: "ngsp-table-ifcc-31",
    input: { unit: "ifcc_mmol_mol", value: 31 },
    expected: { ifccMmolMol: 31, ngspPercent: 5, eAgMgDl: 97, eAgMmolL: 5.4 },
    sourceReferenceId: "ngsp-ifcc-standardization",
    tolerance: 1,
  },
  {
    id: "ngsp-table-ifcc-42",
    input: { unit: "ifcc_mmol_mol", value: 42 },
    expected: { ifccMmolMol: 42, ngspPercent: 6, eAgMgDl: 126, eAgMmolL: 7 },
    sourceReferenceId: "ngsp-ifcc-standardization",
    tolerance: 1,
  },
  {
    id: "ngsp-table-ifcc-53",
    input: { unit: "ifcc_mmol_mol", value: 53 },
    expected: { ifccMmolMol: 53, ngspPercent: 7, eAgMgDl: 154, eAgMmolL: 8.6 },
    sourceReferenceId: "ngsp-ifcc-standardization",
    tolerance: 0.2,
  },
  {
    id: "ngsp-table-ngsp-8",
    input: { unit: "ngsp_percent", value: 8 },
    expected: { ifccMmolMol: 64, ngspPercent: 8, eAgMgDl: 183, eAgMmolL: 10.2 },
    sourceReferenceId: "ngsp-ifcc-standardization",
    tolerance: 0.2,
  },
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const roundTo = (value: number, decimals: number): number => Number(value.toFixed(decimals));

export const validateHba1cConversionInput = (input: unknown): input is Hba1cConversionInput => {
  if (!isRecord(input)) return false;
  if (!isFiniteNumber(input.value)) return false;
  return input.unit === "ifcc_mmol_mol" || input.unit === "ngsp_percent";
};

const assertHba1cRange = (input: Hba1cConversionInput): void => {
  if (input.value <= 0) {
    throw new Error("HbA1c conversion requires a positive value.");
  }
  if (input.unit === "ifcc_mmol_mol" && input.value > 200) {
    throw new Error("HbA1c IFCC input must be <= 200 mmol/mol.");
  }
  if (input.unit === "ngsp_percent" && input.value > 20) {
    throw new Error("HbA1c NGSP input must be <= 20%.");
  }
};

export const convertHba1c = (input: Hba1cConversionInput): Hba1cConversionResult => {
  assertHba1cRange(input);

  const precision = {
    ...defaultPrecision,
    ...input.precision,
  };
  const ngspPercent = input.unit === "ifcc_mmol_mol" ? 0.09148 * input.value + 2.152 : input.value;
  const ifccMmolMol = input.unit === "ngsp_percent" ? 10.93 * input.value - 23.5 : input.value;
  const eAgMgDl = 28.7 * ngspPercent - 46.7;
  const eAgMmolL = eAgMgDl / GLUCOSE_MG_DL_PER_MMOL_L;

  return Object.freeze({
    ifccMmolMol: roundTo(ifccMmolMol, precision.ifccMmolMol),
    ngspPercent: roundTo(ngspPercent, precision.ngspPercent),
    eAgMgDl: roundTo(eAgMgDl, precision.eAgMgDl),
    eAgMmolL: roundTo(eAgMmolL, precision.eAgMmolL),
    formulaVersion: FORMULA_VERSION,
    sourceReferenceIds: SOURCE_REFERENCE_IDS,
  });
};

export const hba1cConversionCalculator = Object.freeze({
  id: "dm.hba1c_conversion",
  version: "0.1.0-next.0",
  label: "HbA1c IFCC/NGSP/eAG conversion",
  formulaVersion: FORMULA_VERSION,
  sourceReferences: hba1cSourceReferences,
  testVectors: hba1cTestVectors,
  verificationStatus: "verified",
  validateInput: validateHba1cConversionInput,
  calculate: (input: Hba1cConversionInput) => convertHba1c(input),
} satisfies VerifiedCalculatorDefinition<
  Hba1cConversionInput,
  Hba1cConversionResult,
  Hba1cConversionExpected
>);
