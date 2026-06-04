import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createCvrmPreventCalculatorRegistry,
  cvrmPreventCalculatorIds,
  cvrmPreventRegistryStatus,
} from "./registry";
import { isVerifiedCvrmPreventCalculator } from "./calculator-contract";
import preventCoefficientData from "./prevent-data.json";
import { calculatePreventRisk, preventCalculator, preventTestVectors } from "./prevent";
import { calculateScore2Risk, score2Calculator, score2TestVectors } from "./score2";

const preventCoefficientKeys = [
  "base_10",
  "base_30",
  "hba1c_10",
  "hba1c_30",
  "uacr_10",
  "uacr_30",
  "sdi_10",
  "sdi_30",
  "full_10",
  "full_30",
] as const;

const preventCoefficientTerms = new Set([
  "age",
  "age_squared",
  "non_hdl_c",
  "hdl_c",
  "sbp_lt_110",
  "sbp_gte_110",
  "dm",
  "smoking",
  "bmi_lt_30",
  "bmi_gte_30",
  "egfr_lt_60",
  "egfr_gte_60",
  "bp_tx",
  "statin",
  "bp_tx_sbp_gte_110",
  "statin_non_hdl_c",
  "age_non_hdl_c",
  "age_hdl_c",
  "age_sbp_gte_110",
  "age_dm",
  "age_smoking",
  "age_bmi_gte_30",
  "age_egfr_lt_60",
  "ln_uacr",
  "missing_uacr",
  "hba1c_dm",
  "hba1c_no_dm",
  "missing_hba1c",
  "sdi_4_to_6",
  "sdi_7_to_10",
  "missing_sdi",
  "constant",
]);

type PreventCoefficientRow = readonly [string, readonly number[]];
type PreventCoefficientData = Readonly<Record<string, readonly PreventCoefficientRow[]>>;

const expectRiskPercentClose = (actual: number, expected: number, tolerance = 0.3): void => {
  expect(actual).toBeGreaterThanOrEqual(expected - tolerance);
  expect(actual).toBeLessThanOrEqual(expected + tolerance);
};

const expectRiskClose = (actual: number, expected: number, tolerance = 0.001): void => {
  expect(actual).toBeGreaterThanOrEqual(expected - tolerance);
  expect(actual).toBeLessThanOrEqual(expected + tolerance);
};

describe("cvrm prevent calculator registry", () => {
  it("exports verified SCORE2 and AHA PREVENT calculators from domain package data", () => {
    const registry = createCvrmPreventCalculatorRegistry();

    expect(cvrmPreventCalculatorIds).toEqual(["cvrm.score2", "cvrm.prevent"]);
    expect(cvrmPreventRegistryStatus).toEqual({
      status: "verified",
      calculatorCount: 2,
      exportsClinicalCalculators: true,
    });
    expect(registry.has("cvrm.score2")).toBe(true);
    expect(registry.has("cvrm.prevent")).toBe(true);
    expect(registry.list()).toHaveLength(2);
    expect(isVerifiedCvrmPreventCalculator(registry.get("cvrm.score2"))).toBe(true);
    expect(isVerifiedCvrmPreventCalculator(registry.get("cvrm.prevent"))).toBe(true);
  });

  it("does not accept unverified calculator definitions as CVRM/PREVENT calculators", () => {
    expect(
      isVerifiedCvrmPreventCalculator({
        id: "cvrm.prevent",
        calculate: () => ({ risk: 0 }),
      }),
    ).toBe(false);
  });

  it("keeps source references and test vectors attached to the calculator", () => {
    expect(score2Calculator.sourceReferences.map((reference) => reference.id)).toContain(
      "u-prevent-validation",
    );
    expect(score2Calculator.sourceReferences.map((reference) => reference.id)).toContain(
      "labbie-score2",
    );
    expect(score2Calculator.testVectors).toHaveLength(score2TestVectors.length);
    expect(score2Calculator.testVectors.length).toBeGreaterThan(3);
    expect(preventCalculator.sourceReferences.map((reference) => reference.id)).toContain(
      "preventr-0.11.0",
    );
    expect(preventCalculator.sourceReferences.map((reference) => reference.id)).toContain(
      "prevent-equations-statement",
    );
    expect(preventCalculator.testVectors).toHaveLength(preventTestVectors.length);
    expect(preventCalculator.testVectors.length).toBeGreaterThan(5);
  });

  it("keeps AHA PREVENT coefficient data structurally complete", () => {
    const coefficientData = preventCoefficientData as unknown as PreventCoefficientData;

    expect(Object.keys(coefficientData).sort()).toEqual([...preventCoefficientKeys].sort());

    for (const key of preventCoefficientKeys) {
      const rows = coefficientData[key];
      const rowTerms = rows.map(([term]) => term);
      const uniqueTerms = new Set(rowTerms);

      expect(rows.length).toBeGreaterThan(0);
      expect(uniqueTerms.size).toBe(rowTerms.length);
      expect(uniqueTerms.has("constant")).toBe(true);
      if (key.endsWith("_30")) expect(uniqueTerms.has("age_squared")).toBe(true);
      if (key.startsWith("hba1c") || key.startsWith("full")) {
        expect(uniqueTerms.has("hba1c_dm")).toBe(true);
        expect(uniqueTerms.has("hba1c_no_dm")).toBe(true);
        expect(uniqueTerms.has("missing_hba1c")).toBe(true);
      }
      if (key.startsWith("uacr") || key.startsWith("full")) {
        expect(uniqueTerms.has("ln_uacr")).toBe(true);
        expect(uniqueTerms.has("missing_uacr")).toBe(true);
      }
      if (key.startsWith("sdi") || key.startsWith("full")) {
        expect(uniqueTerms.has("sdi_4_to_6")).toBe(true);
        expect(uniqueTerms.has("sdi_7_to_10")).toBe(true);
        expect(uniqueTerms.has("missing_sdi")).toBe(true);
      }

      for (const [term, coefficients] of rows) {
        expect(preventCoefficientTerms.has(term)).toBe(true);
        expect(coefficients).toHaveLength(10);
        expect(coefficients.every((coefficient) => Number.isFinite(coefficient))).toBe(true);
      }
    }
  });

  it("matches labbie U-Prevent SCORE2 validation vectors", () => {
    for (const vector of score2TestVectors) {
      const result = calculateScore2Risk(vector.input);
      expect(result.model).toBe(vector.expected.model);
      expectRiskPercentClose(
        result.riskPercent,
        vector.expected.riskPercent,
        vector.tolerance ?? 0.3,
      );
    }
  });

  it("matches preventr AHA PREVENT validation vectors", () => {
    for (const vector of preventTestVectors) {
      const result = calculatePreventRisk(vector.input);
      expect(result.modelType).toBe(vector.expected.modelType);
      for (const expectedRisk of vector.expected.risks) {
        const actualRisk = result.risks.find((risk) => risk.horizon === expectedRisk.horizon);
        expect(actualRisk).toBeDefined();
        expectRiskClose(actualRisk?.totalCvd ?? Number.NaN, expectedRisk.totalCvd);
        expectRiskClose(actualRisk?.ascvd ?? Number.NaN, expectedRisk.ascvd);
        expectRiskClose(actualRisk?.heartFailure ?? Number.NaN, expectedRisk.heartFailure);
        expectRiskClose(actualRisk?.chd ?? Number.NaN, expectedRisk.chd);
        expectRiskClose(actualRisk?.stroke ?? Number.NaN, expectedRisk.stroke);
      }
    }
  });

  it("matches SCORE2 model selection and risk class thresholds", () => {
    expect(
      calculateScore2Risk({
        age: 45,
        sex: "F",
        smoking: false,
        systolicBp: 120,
        totalCholesterol: 5,
        hdlCholesterol: 1.5,
      }).riskClass.label,
    ).toBe("laag-matig");

    expect(
      calculateScore2Risk({
        age: 75,
        sex: "M",
        smoking: true,
        systolicBp: 140,
        totalCholesterol: 5.5,
        hdlCholesterol: 1.3,
      }).model,
    ).toBe("SCORE2-OP");
  });

  it("rejects clinically invalid SCORE2 inputs with explicit messages", () => {
    expect(() =>
      calculateScore2Risk({
        age: 39,
        sex: "M",
        smoking: false,
        systolicBp: 120,
        totalCholesterol: 5,
        hdlCholesterol: 1.3,
      }),
    ).toThrow("SCORE2 requires age >= 40 years.");

    expect(() =>
      calculateScore2Risk({
        age: 55,
        sex: "M",
        smoking: false,
        systolicBp: 120,
        totalCholesterol: 5,
        hdlCholesterol: 1.3,
        hasDiabetes: true,
        diabetesAge: 60,
      }),
    ).toThrow("SCORE2-Diabetes requires diabetesAge to be <= age.");
  });

  it("rejects clinically invalid PREVENT inputs with explicit messages", () => {
    expect(() =>
      calculatePreventRisk({
        age: 29,
        sex: "female",
        systolicBp: 120,
        bpTreatment: false,
        totalCholesterolMgDl: 200,
        hdlCholesterolMgDl: 45,
        statin: false,
        diabetes: false,
        smoking: false,
        egfrMlMin173m2: 90,
        bmi: 25,
      }),
    ).toThrow("PREVENT requires age between 30 and 79 years.");

    expect(() =>
      calculatePreventRisk({
        age: 55,
        sex: "male",
        systolicBp: 120,
        bpTreatment: false,
        totalCholesterolMgDl: 200,
        hdlCholesterolMgDl: 45,
        statin: false,
        diabetes: false,
        smoking: false,
        egfrMlMin173m2: 90,
        bmi: 25,
        sdiDecile: 11,
      }),
    ).toThrow("PREVENT requires SDI decile between 1 and 10.");
  });

  it("keeps the registry source tied to real calculator definitions", () => {
    const source = readFileSync("packages/cvrm-prevent/src/registry.ts", "utf8");

    expect(source).toContain("score2Calculator");
    expect(source).toContain("preventCalculator");
    expect(source).not.toContain("createCalculatorRegistry([])");
  });
});
