import type { CalculatorExecutionContext } from "@beslismodel/core";
import type {
  CvrmPreventSourceReference,
  CvrmPreventTestVector,
  VerifiedCvrmPreventCalculatorDefinition,
} from "./calculator-contract";
import coefficientData from "./prevent-data.json";

export type PreventSex = "female" | "male";
export type PreventModelType = "base" | "hba1c" | "uacr" | "sdi" | "full";
export type PreventHorizon = 10 | 30;
export type PreventOutcome = "totalCvd" | "ascvd" | "heartFailure" | "chd" | "stroke";

export interface PreventInput {
  readonly age: number;
  readonly sex: PreventSex;
  readonly systolicBp: number;
  readonly bpTreatment: boolean;
  readonly totalCholesterolMgDl: number;
  readonly hdlCholesterolMgDl: number;
  readonly statin: boolean;
  readonly diabetes: boolean;
  readonly smoking: boolean;
  readonly egfrMlMin173m2: number;
  readonly bmi: number;
  readonly hba1cPercent?: number;
  readonly uacrMgG?: number;
  readonly sdiDecile?: number;
  readonly modelType?: PreventModelType;
}

export interface PreventRiskSet {
  readonly horizon: PreventHorizon;
  readonly totalCvd: number;
  readonly ascvd: number;
  readonly heartFailure: number;
  readonly chd: number;
  readonly stroke: number;
  readonly riskPercent: Readonly<Record<PreventOutcome, number>>;
}

export interface PreventResult {
  readonly modelType: PreventModelType;
  readonly risks: readonly PreventRiskSet[];
  readonly formulaVersion: string;
  readonly sourceReferenceIds: readonly string[];
}

type CoefficientTerm =
  | "age"
  | "age_squared"
  | "non_hdl_c"
  | "hdl_c"
  | "sbp_lt_110"
  | "sbp_gte_110"
  | "dm"
  | "smoking"
  | "bmi_lt_30"
  | "bmi_gte_30"
  | "egfr_lt_60"
  | "egfr_gte_60"
  | "bp_tx"
  | "statin"
  | "bp_tx_sbp_gte_110"
  | "statin_non_hdl_c"
  | "age_non_hdl_c"
  | "age_hdl_c"
  | "age_sbp_gte_110"
  | "age_dm"
  | "age_smoking"
  | "age_bmi_gte_30"
  | "age_egfr_lt_60"
  | "ln_uacr"
  | "missing_uacr"
  | "hba1c_dm"
  | "hba1c_no_dm"
  | "missing_hba1c"
  | "sdi_4_to_6"
  | "sdi_7_to_10"
  | "missing_sdi"
  | "constant";

type PreventCoefficientRow = readonly [CoefficientTerm, readonly number[]];
type PreventCoefficientKey =
  | "base_10"
  | "base_30"
  | "hba1c_10"
  | "hba1c_30"
  | "uacr_10"
  | "uacr_30"
  | "sdi_10"
  | "sdi_30"
  | "full_10"
  | "full_30";

type PreventCoefficientData = Readonly<
  Record<PreventCoefficientKey, readonly PreventCoefficientRow[]>
>;
type PreparedPreventTerms = Readonly<Record<CoefficientTerm, number>>;

const PREVENT_COEFFICIENTS = coefficientData as unknown as PreventCoefficientData;

const FORMULA_VERSION = "aha-prevent-preventr-0.11.0-2025-01-26";
const CHOLESTEROL_MG_DL_TO_MMOL_L = 0.02586;

const OUTCOME_INDEX: Record<PreventSex, Record<PreventOutcome, number>> = {
  female: {
    totalCvd: 0,
    ascvd: 2,
    heartFailure: 4,
    chd: 6,
    stroke: 8,
  },
  male: {
    totalCvd: 1,
    ascvd: 3,
    heartFailure: 5,
    chd: 7,
    stroke: 9,
  },
};

export const preventSourceReferences: readonly CvrmPreventSourceReference[] = Object.freeze([
  {
    id: "aha-prevent-calculator",
    title: "American Heart Association PREVENT calculator overview",
    url: "https://professional.heart.org/en/guidelines-and-statements/about-prevent-calculator",
    version: "AHA Professional Heart Daily, retrieved 2026-06-04",
    retrieved: "2026-06-04",
  },
  {
    id: "prevent-equations-statement",
    title:
      "Novel Prediction Equations for Absolute Risk Assessment of Total Cardiovascular Disease Incorporating Cardiovascular-Kidney-Metabolic Health",
    url: "https://doi.org/10.1161/CIRCULATIONAHA.123.067626",
    version: "Circulation scientific statement, 2023",
  },
  {
    id: "preventr-0.11.0",
    title: "preventr 0.11.0 implementation of AHA PREVENT equations",
    url: "https://cran.r-project.org/package=preventr",
    version: "CRAN source package 0.11.0, MIT license, packaged 2025-01-26",
    retrieved: "2026-06-04",
  },
]);

export const preventTestVectors: readonly CvrmPreventTestVector<
  PreventInput,
  Pick<PreventResult, "modelType" | "risks">
>[] = Object.freeze([
  {
    id: "preventr-table-s25-female-base",
    input: {
      age: 50,
      sex: "female",
      systolicBp: 160,
      bpTreatment: true,
      totalCholesterolMgDl: 200,
      hdlCholesterolMgDl: 45,
      statin: false,
      diabetes: true,
      smoking: false,
      egfrMlMin173m2: 90,
      bmi: 35,
    },
    expected: {
      modelType: "base",
      risks: [
        {
          horizon: 10,
          totalCvd: 0.147,
          ascvd: 0.092,
          heartFailure: 0.081,
          chd: 0.044,
          stroke: 0.054,
          riskPercent: { totalCvd: 14.7, ascvd: 9.2, heartFailure: 8.1, chd: 4.4, stroke: 5.4 },
        },
        {
          horizon: 30,
          totalCvd: 0.53,
          ascvd: 0.354,
          heartFailure: 0.39,
          chd: 0.198,
          stroke: 0.221,
          riskPercent: { totalCvd: 53, ascvd: 35.4, heartFailure: 39, chd: 19.8, stroke: 22.1 },
        },
      ],
    },
    sourceReferenceId: "preventr-0.11.0",
    tolerance: 0.001,
  },
  {
    id: "preventr-male-base",
    input: {
      age: 50,
      sex: "male",
      systolicBp: 160,
      bpTreatment: true,
      totalCholesterolMgDl: 200,
      hdlCholesterolMgDl: 45,
      statin: false,
      diabetes: true,
      smoking: false,
      egfrMlMin173m2: 90,
      bmi: 35,
    },
    expected: {
      modelType: "base",
      risks: [
        {
          horizon: 10,
          totalCvd: 0.163,
          ascvd: 0.102,
          heartFailure: 0.106,
          chd: 0.056,
          stroke: 0.052,
          riskPercent: { totalCvd: 16.3, ascvd: 10.2, heartFailure: 10.6, chd: 5.6, stroke: 5.2 },
        },
        {
          horizon: 30,
          totalCvd: 0.514,
          ascvd: 0.349,
          heartFailure: 0.424,
          chd: 0.216,
          stroke: 0.197,
          riskPercent: { totalCvd: 51.4, ascvd: 34.9, heartFailure: 42.4, chd: 21.6, stroke: 19.7 },
        },
      ],
    },
    sourceReferenceId: "preventr-0.11.0",
    tolerance: 0.001,
  },
  {
    id: "preventr-female-hba1c",
    input: {
      age: 50,
      sex: "female",
      systolicBp: 160,
      bpTreatment: true,
      totalCholesterolMgDl: 200,
      hdlCholesterolMgDl: 45,
      statin: false,
      diabetes: true,
      smoking: false,
      egfrMlMin173m2: 90,
      bmi: 35,
      hba1cPercent: 9.2,
    },
    expected: {
      modelType: "hba1c",
      risks: [
        {
          horizon: 10,
          totalCvd: 0.165,
          ascvd: 0.103,
          heartFailure: 0.107,
          chd: 0.055,
          stroke: 0.053,
          riskPercent: { totalCvd: 16.5, ascvd: 10.3, heartFailure: 10.7, chd: 5.5, stroke: 5.3 },
        },
        {
          horizon: 30,
          totalCvd: 0.541,
          ascvd: 0.356,
          heartFailure: 0.449,
          chd: 0.219,
          stroke: 0.2,
          riskPercent: { totalCvd: 54.1, ascvd: 35.6, heartFailure: 44.9, chd: 21.9, stroke: 20 },
        },
      ],
    },
    sourceReferenceId: "preventr-0.11.0",
    tolerance: 0.001,
  },
  {
    id: "preventr-female-uacr",
    input: {
      age: 50,
      sex: "female",
      systolicBp: 160,
      bpTreatment: true,
      totalCholesterolMgDl: 200,
      hdlCholesterolMgDl: 45,
      statin: false,
      diabetes: true,
      smoking: false,
      egfrMlMin173m2: 90,
      bmi: 35,
      uacrMgG: 92,
    },
    expected: {
      modelType: "uacr",
      risks: [
        {
          horizon: 10,
          totalCvd: 0.181,
          ascvd: 0.111,
          heartFailure: 0.105,
          chd: 0.055,
          stroke: 0.065,
          riskPercent: { totalCvd: 18.1, ascvd: 11.1, heartFailure: 10.5, chd: 5.5, stroke: 6.5 },
        },
        {
          horizon: 30,
          totalCvd: 0.565,
          ascvd: 0.381,
          heartFailure: 0.437,
          chd: 0.22,
          stroke: 0.241,
          riskPercent: { totalCvd: 56.5, ascvd: 38.1, heartFailure: 43.7, chd: 22, stroke: 24.1 },
        },
      ],
    },
    sourceReferenceId: "preventr-0.11.0",
    tolerance: 0.001,
  },
  {
    id: "preventr-female-sdi",
    input: {
      age: 50,
      sex: "female",
      systolicBp: 160,
      bpTreatment: true,
      totalCholesterolMgDl: 200,
      hdlCholesterolMgDl: 45,
      statin: false,
      diabetes: true,
      smoking: false,
      egfrMlMin173m2: 90,
      bmi: 35,
      sdiDecile: 3,
    },
    expected: {
      modelType: "sdi",
      risks: [
        {
          horizon: 10,
          totalCvd: 0.127,
          ascvd: 0.08,
          heartFailure: 0.07,
          chd: 0.038,
          stroke: 0.047,
          riskPercent: { totalCvd: 12.7, ascvd: 8, heartFailure: 7, chd: 3.8, stroke: 4.7 },
        },
        {
          horizon: 30,
          totalCvd: 0.485,
          ascvd: 0.322,
          heartFailure: 0.358,
          chd: 0.179,
          stroke: 0.202,
          riskPercent: { totalCvd: 48.5, ascvd: 32.2, heartFailure: 35.8, chd: 17.9, stroke: 20.2 },
        },
      ],
    },
    sourceReferenceId: "preventr-0.11.0",
    tolerance: 0.001,
  },
  {
    id: "preventr-female-full",
    input: {
      age: 50,
      sex: "female",
      systolicBp: 160,
      bpTreatment: true,
      totalCholesterolMgDl: 200,
      hdlCholesterolMgDl: 45,
      statin: false,
      diabetes: true,
      smoking: false,
      egfrMlMin173m2: 90,
      bmi: 35,
      hba1cPercent: 9.2,
      uacrMgG: 92,
      sdiDecile: 3,
    },
    expected: {
      modelType: "full",
      risks: [
        {
          horizon: 10,
          totalCvd: 0.174,
          ascvd: 0.105,
          heartFailure: 0.114,
          chd: 0.056,
          stroke: 0.056,
          riskPercent: { totalCvd: 17.4, ascvd: 10.5, heartFailure: 11.4, chd: 5.6, stroke: 5.6 },
        },
        {
          horizon: 30,
          totalCvd: 0.534,
          ascvd: 0.348,
          heartFailure: 0.443,
          chd: 0.213,
          stroke: 0.204,
          riskPercent: { totalCvd: 53.4, ascvd: 34.8, heartFailure: 44.3, chd: 21.3, stroke: 20.4 },
        },
      ],
    },
    sourceReferenceId: "preventr-0.11.0",
    tolerance: 0.001,
  },
]);

const SOURCE_REFERENCE_IDS = preventSourceReferences.map((reference) => reference.id);
const OUTCOMES: readonly PreventOutcome[] = ["totalCvd", "ascvd", "heartFailure", "chd", "stroke"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const roundRisk = (risk: number): number => Number(risk.toFixed(6));
const roundPercent = (risk: number): number => Number((risk * 100).toFixed(1));
const toMmolL = (cholesterolMgDl: number): number => cholesterolMgDl * CHOLESTEROL_MG_DL_TO_MMOL_L;
const binary = (value: boolean): number => (value ? 1 : 0);

const logistic = (logOdds: number): number => {
  const exp = Math.exp(logOdds);
  return exp / (1 + exp);
};

const isBetween = (value: number | undefined, lower: number, upper: number): boolean =>
  value !== undefined && value >= lower && value <= upper;

const hasHba1c = (input: PreventInput): boolean => input.hba1cPercent !== undefined;
const hasUacr = (input: PreventInput): boolean => input.uacrMgG !== undefined;
const hasSdi = (input: PreventInput): boolean => input.sdiDecile !== undefined;

export const validatePreventInput = (input: unknown): input is PreventInput => {
  if (!isRecord(input)) return false;
  if (!isFiniteNumber(input.age)) return false;
  if (input.sex !== "female" && input.sex !== "male") return false;
  if (!isFiniteNumber(input.systolicBp)) return false;
  if (!isBoolean(input.bpTreatment)) return false;
  if (!isFiniteNumber(input.totalCholesterolMgDl)) return false;
  if (!isFiniteNumber(input.hdlCholesterolMgDl)) return false;
  if (!isBoolean(input.statin)) return false;
  if (!isBoolean(input.diabetes)) return false;
  if (!isBoolean(input.smoking)) return false;
  if (!isFiniteNumber(input.egfrMlMin173m2)) return false;
  if (!isFiniteNumber(input.bmi)) return false;
  if (input.hba1cPercent !== undefined && !isFiniteNumber(input.hba1cPercent)) return false;
  if (input.uacrMgG !== undefined && !isFiniteNumber(input.uacrMgG)) return false;
  if (input.sdiDecile !== undefined && !isFiniteNumber(input.sdiDecile)) return false;
  if (
    input.modelType !== undefined &&
    input.modelType !== "base" &&
    input.modelType !== "hba1c" &&
    input.modelType !== "uacr" &&
    input.modelType !== "sdi" &&
    input.modelType !== "full"
  ) {
    return false;
  }
  return true;
};

const assertRange = (valid: boolean, message: string): void => {
  if (!valid) throw new Error(message);
};

const assertClinicalPreventInput = (input: PreventInput): void => {
  assertRange(input.age >= 30 && input.age <= 79, "PREVENT requires age between 30 and 79 years.");
  assertRange(
    input.systolicBp >= 90 && input.systolicBp <= 180,
    "PREVENT requires systolic blood pressure between 90 and 180 mmHg.",
  );
  assertRange(
    input.totalCholesterolMgDl >= 130 && input.totalCholesterolMgDl <= 320,
    "PREVENT requires total cholesterol between 130 and 320 mg/dL.",
  );
  assertRange(
    input.hdlCholesterolMgDl >= 20 && input.hdlCholesterolMgDl <= 100,
    "PREVENT requires HDL cholesterol between 20 and 100 mg/dL.",
  );
  assertRange(
    input.egfrMlMin173m2 >= 15 && input.egfrMlMin173m2 <= 140,
    "PREVENT requires eGFR between 15 and 140 mL/min/1.73m2.",
  );
  assertRange(
    input.bmi >= 18.5 && input.bmi <= 39.9,
    "PREVENT requires BMI between 18.5 and 39.9.",
  );
  if (input.hba1cPercent !== undefined) {
    assertRange(
      input.hba1cPercent >= 4.5 && input.hba1cPercent <= 15,
      "PREVENT requires HbA1c between 4.5 and 15 percent.",
    );
  }
  if (input.uacrMgG !== undefined) {
    assertRange(
      input.uacrMgG >= 0.1 && input.uacrMgG <= 25_000,
      "PREVENT requires UACR between 0.1 and 25000 mg/g.",
    );
  }
  if (input.sdiDecile !== undefined) {
    assertRange(
      Number.isInteger(input.sdiDecile) && input.sdiDecile >= 1 && input.sdiDecile <= 10,
      "PREVENT requires SDI decile between 1 and 10.",
    );
  }
};

export const selectPreventModelType = (input: PreventInput): PreventModelType => {
  if (input.modelType !== undefined) return input.modelType;
  const optionalCount = Number(hasHba1c(input)) + Number(hasUacr(input)) + Number(hasSdi(input));
  if (optionalCount >= 2) return "full";
  if (hasHba1c(input)) return "hba1c";
  if (hasUacr(input)) return "uacr";
  if (hasSdi(input)) return "sdi";
  return "base";
};

const preparePreventTerms = (input: PreventInput): PreparedPreventTerms => {
  const age = (input.age - 55) / 10;
  const nonHdlC = toMmolL(input.totalCholesterolMgDl - input.hdlCholesterolMgDl) - 3.5;
  const hdlC = (toMmolL(input.hdlCholesterolMgDl) - 1.3) / 0.3;
  const sbpLt110 = (Math.min(input.systolicBp, 110) - 110) / 20;
  const sbpGte110 = (Math.max(input.systolicBp, 110) - 130) / 20;
  const dm = binary(input.diabetes);
  const smoking = binary(input.smoking);
  const bmiLt30 = (Math.min(input.bmi, 30) - 25) / 5;
  const bmiGte30 = (Math.max(input.bmi, 30) - 30) / 5;
  const egfrLt60 = (Math.min(input.egfrMlMin173m2, 60) - 60) / -15;
  const egfrGte60 = (Math.max(input.egfrMlMin173m2, 60) - 90) / -15;
  const bpTx = binary(input.bpTreatment);
  const statin = binary(input.statin);
  const hba1c = input.hba1cPercent;
  const uacr = input.uacrMgG;
  const sdi = input.sdiDecile;

  return {
    age,
    age_squared: age * age,
    non_hdl_c: nonHdlC,
    hdl_c: hdlC,
    sbp_lt_110: sbpLt110,
    sbp_gte_110: sbpGte110,
    dm,
    smoking,
    bmi_lt_30: bmiLt30,
    bmi_gte_30: bmiGte30,
    egfr_lt_60: egfrLt60,
    egfr_gte_60: egfrGte60,
    bp_tx: bpTx,
    statin,
    bp_tx_sbp_gte_110: bpTx * sbpGte110,
    statin_non_hdl_c: statin * nonHdlC,
    age_non_hdl_c: age * nonHdlC,
    age_hdl_c: age * hdlC,
    age_sbp_gte_110: age * sbpGte110,
    age_dm: age * dm,
    age_smoking: age * smoking,
    age_bmi_gte_30: age * bmiGte30,
    age_egfr_lt_60: age * egfrLt60,
    ln_uacr: uacr !== undefined ? Math.log(uacr) : 0,
    missing_uacr: uacr === undefined ? 1 : 0,
    hba1c_dm: hba1c !== undefined && input.diabetes ? hba1c - 5.3 : 0,
    hba1c_no_dm: hba1c !== undefined && !input.diabetes ? hba1c - 5.3 : 0,
    missing_hba1c: hba1c === undefined ? 1 : 0,
    sdi_4_to_6: isBetween(sdi, 4, 6) ? 1 : 0,
    sdi_7_to_10: isBetween(sdi, 7, 10) ? 1 : 0,
    missing_sdi: sdi === undefined ? 1 : 0,
    constant: 1,
  };
};

const coefficientKey = (
  modelType: PreventModelType,
  horizon: PreventHorizon,
): PreventCoefficientKey => `${modelType}_${horizon}` as PreventCoefficientKey;

const calculatePreventRiskSet = (
  input: PreventInput,
  modelType: PreventModelType,
  horizon: PreventHorizon,
): PreventRiskSet => {
  const terms = preparePreventTerms(input);
  const rows = PREVENT_COEFFICIENTS[coefficientKey(modelType, horizon)];
  const risks = Object.fromEntries(
    OUTCOMES.map((outcome) => {
      const columnIndex = OUTCOME_INDEX[input.sex][outcome];
      const logOdds = rows.reduce(
        (total, [term, coefficients]) => total + terms[term] * coefficients[columnIndex],
        0,
      );
      return [outcome, roundRisk(logistic(logOdds))];
    }),
  ) as Record<PreventOutcome, number>;

  return {
    horizon,
    totalCvd: risks.totalCvd,
    ascvd: risks.ascvd,
    heartFailure: risks.heartFailure,
    chd: risks.chd,
    stroke: risks.stroke,
    riskPercent: {
      totalCvd: roundPercent(risks.totalCvd),
      ascvd: roundPercent(risks.ascvd),
      heartFailure: roundPercent(risks.heartFailure),
      chd: roundPercent(risks.chd),
      stroke: roundPercent(risks.stroke),
    },
  };
};

export const calculatePreventRisk = (input: PreventInput): PreventResult => {
  assertClinicalPreventInput(input);
  const modelType = selectPreventModelType(input);

  return {
    modelType,
    risks: [
      calculatePreventRiskSet(input, modelType, 10),
      calculatePreventRiskSet(input, modelType, 30),
    ],
    formulaVersion: FORMULA_VERSION,
    sourceReferenceIds: SOURCE_REFERENCE_IDS,
  };
};

export const preventCalculator: VerifiedCvrmPreventCalculatorDefinition<
  PreventInput,
  PreventResult,
  Pick<PreventResult, "modelType" | "risks">
> = {
  id: "cvrm.prevent",
  version: "0.1.0",
  label: "AHA PREVENT 10-year and 30-year CVD/ASCVD/HF/CHD/stroke",
  formulaVersion: FORMULA_VERSION,
  sourceReferences: preventSourceReferences,
  testVectors: preventTestVectors,
  verificationStatus: "verified",
  validateInput: validatePreventInput,
  calculate: (input: PreventInput, _context: CalculatorExecutionContext): PreventResult =>
    calculatePreventRisk(input),
};
