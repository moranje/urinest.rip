import type { CalculatorExecutionContext } from "@beslismodel/core";
import type {
  CvrmPreventSourceReference,
  CvrmPreventTestVector,
  VerifiedCvrmPreventCalculatorDefinition,
} from "./calculator-contract";

export type Score2Sex = "M" | "F";
export type Score2Region = "low" | "moderate" | "high" | "very_high";
export type Score2Model = "SCORE2" | "SCORE2-OP" | "SCORE2-Diabetes";
export type Score2Severity = "info" | "mild" | "significant" | "critical";

export interface Score2Input {
  readonly age: number;
  readonly sex: Score2Sex;
  readonly smoking: boolean;
  readonly systolicBp: number;
  readonly totalCholesterol: number;
  readonly hdlCholesterol: number;
  readonly region?: Score2Region;
  readonly hasDiabetes?: boolean;
  readonly diabetesAge?: number;
  readonly hba1cMmolMol?: number;
  readonly egfrMlMin?: number;
}

export interface Score2RiskClass {
  readonly label: string;
  readonly severity: Score2Severity;
  readonly advice: string;
}

export interface Score2Result {
  readonly model: Score2Model;
  readonly risk: number;
  readonly riskPercent: number;
  readonly riskClass: Score2RiskClass;
  readonly region: Score2Region;
  readonly formulaVersion: string;
  readonly sourceReferenceIds: readonly string[];
}

interface ModelCoefficients {
  readonly age: number;
  readonly smoking: number;
  readonly sbp: number;
  readonly diabetes: number;
  readonly tchol: number;
  readonly hdl: number;
  readonly smoking_age: number;
  readonly sbp_age: number;
  readonly diabetes_age: number;
  readonly tchol_age: number;
  readonly hdl_age: number;
}

interface Score2DiabetesExtra {
  readonly agediab: number;
  readonly a1c: number;
  readonly egfr: number;
  readonly egfr2: number;
  readonly a1c_age: number;
  readonly egfr_age: number;
}

interface Score2OpCoefficients {
  readonly age: number;
  readonly diabetes: number;
  readonly smoking: number;
  readonly sbp: number;
  readonly tchol: number;
  readonly hdl: number;
  readonly diabetes_age: number;
  readonly smoking_age: number;
  readonly sbp_age: number;
  readonly tchol_age: number;
  readonly hdl_age: number;
}

interface RegionScales {
  readonly scale1: number;
  readonly scale2: number;
}

const SCORE2_MALE: ModelCoefficients = {
  age: 0.3742,
  smoking: 0.6012,
  sbp: 0.2777,
  diabetes: 0.6457,
  tchol: 0.1458,
  hdl: -0.2698,
  smoking_age: -0.0755,
  sbp_age: -0.0255,
  diabetes_age: -0.0983,
  tchol_age: -0.0281,
  hdl_age: 0.0426,
};

const SCORE2_FEMALE: ModelCoefficients = {
  age: 0.4648,
  smoking: 0.7744,
  sbp: 0.3131,
  diabetes: 0.8096,
  tchol: 0.1002,
  hdl: -0.2606,
  smoking_age: -0.1088,
  sbp_age: -0.0277,
  diabetes_age: -0.1272,
  tchol_age: -0.0226,
  hdl_age: 0.0613,
};

const SCORE2_DM_MALE: ModelCoefficients & Score2DiabetesExtra = {
  age: 0.5368,
  smoking: 0.4774,
  sbp: 0.1322,
  diabetes: 0.6457,
  tchol: 0.1102,
  hdl: -0.1087,
  smoking_age: -0.0672,
  sbp_age: -0.0268,
  diabetes_age: -0.0983,
  tchol_age: -0.0181,
  hdl_age: 0.0095,
  agediab: -0.0998,
  a1c: 0.0955,
  egfr: -0.0591,
  egfr2: 0.0058,
  a1c_age: -0.0134,
  egfr_age: 0.0115,
};

const SCORE2_DM_FEMALE: ModelCoefficients & Score2DiabetesExtra = {
  age: 0.6624,
  smoking: 0.6139,
  sbp: 0.1421,
  diabetes: 0.8096,
  tchol: 0.1127,
  hdl: -0.1568,
  smoking_age: -0.1122,
  sbp_age: -0.0167,
  diabetes_age: -0.1272,
  tchol_age: -0.02,
  hdl_age: 0.0186,
  agediab: -0.118,
  a1c: 0.1173,
  egfr: -0.064,
  egfr2: 0.0062,
  a1c_age: -0.0196,
  egfr_age: 0.0169,
};

const SCORE2_OP_MALE: Score2OpCoefficients = {
  age: 0.0634,
  diabetes: 0.4245,
  smoking: 0.3524,
  sbp: 0.0094,
  tchol: 0.085,
  hdl: -0.3564,
  diabetes_age: -0.0174,
  smoking_age: -0.0247,
  sbp_age: -0.0005,
  tchol_age: 0.0073,
  hdl_age: 0.0091,
};

const SCORE2_OP_FEMALE: Score2OpCoefficients = {
  age: 0.0789,
  diabetes: 0.601,
  smoking: 0.4921,
  sbp: 0.0102,
  tchol: 0.0605,
  hdl: -0.304,
  diabetes_age: -0.0107,
  smoking_age: -0.0255,
  sbp_age: -0.0004,
  tchol_age: -0.0009,
  hdl_age: 0.0154,
};

const BASELINE_SCORE2 = { male: 0.9605, female: 0.9776 } as const;
const BASELINE_SCORE2_OP = { male: 0.7576, female: 0.8082 } as const;
const MLP_SCORE2_OP = { male: 0.0929, female: 0.229 } as const;

const CALIBRATION_SCORE2: Record<Score2Region, { male: RegionScales; female: RegionScales }> = {
  low: {
    male: { scale1: -0.5699, scale2: 0.7476 },
    female: { scale1: -0.738, scale2: 0.7019 },
  },
  moderate: {
    male: { scale1: -0.1565, scale2: 0.8009 },
    female: { scale1: -0.3143, scale2: 0.7701 },
  },
  high: {
    male: { scale1: 0.3207, scale2: 0.936 },
    female: { scale1: 0.571, scale2: 0.9369 },
  },
  very_high: {
    male: { scale1: 0.5836, scale2: 0.8294 },
    female: { scale1: 0.9412, scale2: 0.8329 },
  },
};

const CALIBRATION_SCORE2_OP: Record<Score2Region, { male: RegionScales; female: RegionScales }> = {
  low: {
    male: { scale1: -0.34, scale2: 1.19 },
    female: { scale1: -0.52, scale2: 1.01 },
  },
  moderate: {
    male: { scale1: 0.01, scale2: 1.25 },
    female: { scale1: -0.1, scale2: 1.1 },
  },
  high: {
    male: { scale1: 0.08, scale2: 1.15 },
    female: { scale1: 0.38, scale2: 1.09 },
  },
  very_high: {
    male: { scale1: 0.05, scale2: 0.7 },
    female: { scale1: 0.38, scale2: 0.69 },
  },
};

export const score2SourceReferences: readonly CvrmPreventSourceReference[] = Object.freeze([
  {
    id: "labbie-score2",
    title: "Labbie SCORE2/U-Prevent calculator implementation and coefficients",
    url: "https://git.oranje.wtf/martien/labbie/src/branch/main/src/lib/interpreter/rules/score2.ts",
    version: "labbie local source reviewed 2026-06-03",
  },
  {
    id: "u-prevent-validation",
    title: "U-Prevent SCORE2 API validation vectors captured by labbie",
    url: "https://u-prevent.com",
    version: "API vectors retrieved 2026-02-28",
    retrieved: "2026-02-28",
  },
  {
    id: "score2-paper",
    title: "SCORE2 risk prediction algorithms, European Heart Journal 2021",
    url: "https://doi.org/10.1093/eurheartj/ehab309",
    version: "Eur Heart J 2021;42:2439-2454",
  },
  {
    id: "score2-op-paper",
    title: "SCORE2-OP risk prediction algorithms, European Heart Journal 2021",
    url: "https://doi.org/10.1093/eurheartj/ehab312",
    version: "Eur Heart J 2021;42:2455-2467",
  },
  {
    id: "score2-diabetes-paper",
    title: "SCORE2-Diabetes, European Heart Journal 2023",
    url: "https://doi.org/10.1093/eurheartj/ehad260",
    version: "Eur Heart J 2023;44:2544-2556",
  },
]);

export const score2TestVectors: readonly CvrmPreventTestVector<
  Score2Input,
  Pick<Score2Result, "model" | "riskPercent">
>[] = Object.freeze([
  {
    id: "score2-u-prevent-s1",
    input: {
      age: 55,
      sex: "M",
      smoking: false,
      systolicBp: 140,
      totalCholesterol: 5.5,
      hdlCholesterol: 1.3,
      region: "low",
    },
    expected: { model: "SCORE2", riskPercent: 4.5 },
    sourceReferenceId: "u-prevent-validation",
    tolerance: 0.3,
  },
  {
    id: "score2-u-prevent-s2",
    input: {
      age: 55,
      sex: "M",
      smoking: true,
      systolicBp: 140,
      totalCholesterol: 5.5,
      hdlCholesterol: 1.3,
      region: "low",
    },
    expected: { model: "SCORE2", riskPercent: 7.3 },
    sourceReferenceId: "u-prevent-validation",
    tolerance: 0.3,
  },
  {
    id: "score2-op-u-prevent-op1",
    input: {
      age: 75,
      sex: "M",
      smoking: false,
      systolicBp: 140,
      totalCholesterol: 5.5,
      hdlCholesterol: 1.3,
      region: "low",
    },
    expected: { model: "SCORE2-OP", riskPercent: 13.2 },
    sourceReferenceId: "u-prevent-validation",
    tolerance: 0.3,
  },
  {
    id: "score2-diabetes-u-prevent-dm1",
    input: {
      age: 55,
      sex: "M",
      smoking: false,
      systolicBp: 140,
      totalCholesterol: 5.5,
      hdlCholesterol: 1.1,
      region: "low",
      hasDiabetes: true,
      diabetesAge: 45,
      hba1cMmolMol: 53,
      egfrMlMin: 90,
    },
    expected: { model: "SCORE2-Diabetes", riskPercent: 8.3 },
    sourceReferenceId: "u-prevent-validation",
    tolerance: 0.3,
  },
  {
    id: "score2-diabetes-u-prevent-dm4",
    input: {
      age: 65,
      sex: "M",
      smoking: false,
      systolicBp: 160,
      totalCholesterol: 6.5,
      hdlCholesterol: 1,
      region: "low",
      hasDiabetes: true,
      diabetesAge: 40,
      hba1cMmolMol: 64,
      egfrMlMin: 60,
    },
    expected: { model: "SCORE2-Diabetes", riskPercent: 21.3 },
    sourceReferenceId: "u-prevent-validation",
    tolerance: 0.3,
  },
]);

const FORMULA_VERSION = "labbie-score2-u-prevent-2026-02-28";
const SOURCE_REFERENCE_IDS = score2SourceReferences.map((reference) => reference.id);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const validateScore2Input = (input: unknown): input is Score2Input => {
  if (!isRecord(input)) return false;
  if (!isFiniteNumber(input.age)) return false;
  if (input.sex !== "M" && input.sex !== "F") return false;
  if (typeof input.smoking !== "boolean") return false;
  if (!isFiniteNumber(input.systolicBp)) return false;
  if (!isFiniteNumber(input.totalCholesterol)) return false;
  if (!isFiniteNumber(input.hdlCholesterol)) return false;
  if (
    input.region !== undefined &&
    input.region !== "low" &&
    input.region !== "moderate" &&
    input.region !== "high" &&
    input.region !== "very_high"
  ) {
    return false;
  }
  return true;
};

const assertClinicalInput = (input: Score2Input): void => {
  if (input.age < 40) {
    throw new Error("SCORE2 requires age >= 40 years.");
  }
  if (input.systolicBp <= 0) {
    throw new Error("SCORE2 requires a positive systolic blood pressure.");
  }
  if (input.totalCholesterol <= 0 || input.hdlCholesterol <= 0) {
    throw new Error("SCORE2 requires positive total and HDL cholesterol values in mmol/L.");
  }
  if (input.hasDiabetes === true) {
    if (input.diabetesAge !== undefined && input.diabetesAge > input.age) {
      throw new Error("SCORE2-Diabetes requires diabetesAge to be <= age.");
    }
    if (input.hba1cMmolMol !== undefined && input.hba1cMmolMol <= 0) {
      throw new Error("SCORE2-Diabetes requires positive HbA1c in mmol/mol.");
    }
    if (input.egfrMlMin !== undefined && input.egfrMlMin <= 0) {
      throw new Error("SCORE2-Diabetes requires positive eGFR in mL/min.");
    }
  }
};

const calibrate = (uncalibratedRisk: number, scales: RegionScales): number => {
  if (uncalibratedRisk <= 0) return 0;
  if (uncalibratedRisk >= 1) return 1;
  const inner = Math.log(-Math.log(1 - uncalibratedRisk));
  return 1 - Math.exp(-Math.exp(scales.scale1 + scales.scale2 * inner));
};

export const calcScore2 = (
  age: number,
  sex: Score2Sex,
  smoking: boolean,
  sbp: number,
  totalCholesterol: number,
  hdlCholesterol: number,
  diabetes: boolean,
  region: Score2Region,
): number => {
  const beta = sex === "M" ? SCORE2_MALE : SCORE2_FEMALE;
  const centeredAge = (age - 60) / 5;
  const centeredSbp = (sbp - 120) / 20;
  const centeredTotalCholesterol = totalCholesterol - 6;
  const centeredHdl = (hdlCholesterol - 1.3) / 0.5;
  const smokingValue = smoking ? 1 : 0;
  const diabetesValue = diabetes ? 1 : 0;

  const linearPredictor =
    beta.age * centeredAge +
    beta.smoking * smokingValue +
    beta.sbp * centeredSbp +
    beta.diabetes * diabetesValue +
    beta.tchol * centeredTotalCholesterol +
    beta.hdl * centeredHdl +
    beta.smoking_age * (smokingValue * centeredAge) +
    beta.sbp_age * (centeredSbp * centeredAge) +
    beta.diabetes_age * (diabetesValue * centeredAge) +
    beta.tchol_age * (centeredTotalCholesterol * centeredAge) +
    beta.hdl_age * (centeredHdl * centeredAge);

  const baseline = sex === "M" ? BASELINE_SCORE2.male : BASELINE_SCORE2.female;
  const uncalibratedRisk = 1 - Math.pow(baseline, Math.exp(linearPredictor));
  const scales = CALIBRATION_SCORE2[region][sex === "M" ? "male" : "female"];
  return calibrate(uncalibratedRisk, scales);
};

export const calcScore2Op = (
  age: number,
  sex: Score2Sex,
  smoking: boolean,
  sbp: number,
  totalCholesterol: number,
  hdlCholesterol: number,
  diabetes: boolean,
  region: Score2Region,
): number => {
  const beta = sex === "M" ? SCORE2_OP_MALE : SCORE2_OP_FEMALE;
  const centeredAge = age - 73;
  const centeredSbp = sbp - 150;
  const centeredTotalCholesterol = totalCholesterol - 6;
  const centeredHdl = hdlCholesterol - 1.4;
  const smokingValue = smoking ? 1 : 0;
  const diabetesValue = diabetes ? 1 : 0;

  const linearPredictor =
    beta.age * centeredAge +
    beta.diabetes * diabetesValue +
    beta.smoking * smokingValue +
    beta.sbp * centeredSbp +
    beta.tchol * centeredTotalCholesterol +
    beta.hdl * centeredHdl +
    beta.diabetes_age * (diabetesValue * centeredAge) +
    beta.smoking_age * (smokingValue * centeredAge) +
    beta.sbp_age * (centeredSbp * centeredAge) +
    beta.tchol_age * (centeredTotalCholesterol * centeredAge) +
    beta.hdl_age * (centeredHdl * centeredAge);

  const baseline = sex === "M" ? BASELINE_SCORE2_OP.male : BASELINE_SCORE2_OP.female;
  const meanLinearPredictor = sex === "M" ? MLP_SCORE2_OP.male : MLP_SCORE2_OP.female;
  const uncalibratedRisk = 1 - Math.pow(baseline, Math.exp(linearPredictor - meanLinearPredictor));
  const scales = CALIBRATION_SCORE2_OP[region][sex === "M" ? "male" : "female"];
  return calibrate(uncalibratedRisk, scales);
};

export const calcScore2Diabetes = (
  age: number,
  sex: Score2Sex,
  smoking: boolean,
  sbp: number,
  totalCholesterol: number,
  hdlCholesterol: number,
  diabetesAge: number | undefined,
  hba1cMmolMol: number | undefined,
  egfrMlMin: number | undefined,
  region: Score2Region,
): number => {
  const beta = sex === "M" ? SCORE2_DM_MALE : SCORE2_DM_FEMALE;
  const centeredAge = (age - 60) / 5;
  const centeredSbp = (sbp - 120) / 20;
  const centeredTotalCholesterol = totalCholesterol - 6;
  const centeredHdl = (hdlCholesterol - 1.3) / 0.5;
  const smokingValue = smoking ? 1 : 0;
  const centeredDiabetesAge = ((diabetesAge ?? 50) - 50) / 5;
  const centeredHba1c = ((hba1cMmolMol ?? 53) - 31) / 9.34;
  const rawEgfr = egfrMlMin ?? 90;
  const centeredEgfr = (Math.log(rawEgfr) - 4.5) / 0.15;
  const centeredEgfrSquared = centeredEgfr * centeredEgfr;

  const linearPredictor =
    beta.age * centeredAge +
    beta.smoking * smokingValue +
    beta.sbp * centeredSbp +
    beta.diabetes +
    beta.tchol * centeredTotalCholesterol +
    beta.hdl * centeredHdl +
    beta.smoking_age * (smokingValue * centeredAge) +
    beta.sbp_age * (centeredSbp * centeredAge) +
    beta.diabetes_age * centeredAge +
    beta.tchol_age * (centeredTotalCholesterol * centeredAge) +
    beta.hdl_age * (centeredHdl * centeredAge) +
    beta.agediab * centeredDiabetesAge +
    beta.a1c * centeredHba1c +
    beta.egfr * centeredEgfr +
    beta.egfr2 * centeredEgfrSquared +
    beta.a1c_age * (centeredHba1c * centeredAge) +
    beta.egfr_age * (centeredEgfr * centeredAge);

  const baseline = sex === "M" ? BASELINE_SCORE2.male : BASELINE_SCORE2.female;
  const uncalibratedRisk = 1 - Math.pow(baseline, Math.exp(linearPredictor));
  const scales = CALIBRATION_SCORE2[region][sex === "M" ? "male" : "female"];
  return calibrate(uncalibratedRisk, scales);
};

export const classifyScore2Risk = (risk: number, age: number): Score2RiskClass => {
  const percent = risk * 100;
  if (age < 50) {
    if (percent < 2.5) return { label: "laag-matig", severity: "info", advice: "Leefstijl." };
    if (percent < 7.5) {
      return {
        label: "verhoogd",
        severity: "significant",
        advice: "Leefstijl; overweeg medicamenteuze behandeling bij onvoldoende effect.",
      };
    }
    return {
      label: "hoog",
      severity: "critical",
      advice: "Leefstijl en medicamenteuze behandeling overwegen.",
    };
  }
  if (age < 70) {
    if (percent < 5) return { label: "laag-matig", severity: "info", advice: "Leefstijl." };
    if (percent < 10) {
      return {
        label: "verhoogd",
        severity: "significant",
        advice: "Leefstijl; overweeg medicamenteuze behandeling bij onvoldoende effect.",
      };
    }
    return {
      label: "hoog",
      severity: "critical",
      advice: "Leefstijl en medicamenteuze behandeling overwegen.",
    };
  }
  if (percent < 7.5) return { label: "laag-matig", severity: "info", advice: "Leefstijl." };
  if (percent < 15) {
    return {
      label: "verhoogd",
      severity: "significant",
      advice: "Leefstijl; overweeg behandeling met aandacht voor kwetsbaarheid.",
    };
  }
  return {
    label: "hoog",
    severity: "critical",
    advice: "Leefstijl en behandeling overwegen met aandacht voor kwetsbaarheid.",
  };
};

export const classifyDiabetesRisk = (risk: number): Score2RiskClass => {
  const percent = risk * 100;
  if (percent < 5) {
    return {
      label: "laag",
      severity: "info",
      advice: "Leefstijl en optimale glucoseregulatie.",
    };
  }
  if (percent < 10) {
    return {
      label: "matig",
      severity: "mild",
      advice: "Leefstijl en glucoseregulatie; overweeg statine en/of antihypertensivum.",
    };
  }
  if (percent < 20) {
    return {
      label: "hoog",
      severity: "significant",
      advice: "Leefstijl, glucoseregulatie, statine en antihypertensivum.",
    };
  }
  return {
    label: "zeer hoog",
    severity: "critical",
    advice: "Intensieve behandeling volgens CVRM/DM2-beleid.",
  };
};

export const calculateScore2Risk = (input: Score2Input): Score2Result => {
  assertClinicalInput(input);

  const region = input.region ?? "low";
  const model: Score2Model =
    input.hasDiabetes === true ? "SCORE2-Diabetes" : input.age >= 70 ? "SCORE2-OP" : "SCORE2";
  const risk =
    model === "SCORE2-Diabetes"
      ? calcScore2Diabetes(
          input.age,
          input.sex,
          input.smoking,
          input.systolicBp,
          input.totalCholesterol,
          input.hdlCholesterol,
          input.diabetesAge,
          input.hba1cMmolMol,
          input.egfrMlMin,
          region,
        )
      : model === "SCORE2-OP"
        ? calcScore2Op(
            input.age,
            input.sex,
            input.smoking,
            input.systolicBp,
            input.totalCholesterol,
            input.hdlCholesterol,
            false,
            region,
          )
        : calcScore2(
            input.age,
            input.sex,
            input.smoking,
            input.systolicBp,
            input.totalCholesterol,
            input.hdlCholesterol,
            false,
            region,
          );

  return {
    model,
    risk,
    riskPercent: Number((risk * 100).toFixed(1)),
    riskClass:
      model === "SCORE2-Diabetes"
        ? classifyDiabetesRisk(risk)
        : classifyScore2Risk(risk, input.age),
    region,
    formulaVersion: FORMULA_VERSION,
    sourceReferenceIds: SOURCE_REFERENCE_IDS,
  };
};

export const score2Calculator: VerifiedCvrmPreventCalculatorDefinition<
  Score2Input,
  Score2Result,
  Pick<Score2Result, "model" | "riskPercent">
> = {
  id: "cvrm.score2",
  version: "0.1.0",
  label: "SCORE2 / SCORE2-OP / SCORE2-Diabetes",
  formulaVersion: FORMULA_VERSION,
  sourceReferences: score2SourceReferences,
  testVectors: score2TestVectors,
  verificationStatus: "verified",
  validateInput: validateScore2Input,
  calculate: (input: Score2Input, _context: CalculatorExecutionContext): Score2Result =>
    calculateScore2Risk(input),
};
