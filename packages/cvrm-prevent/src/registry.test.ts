import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createCvrmPreventCalculatorRegistry,
  cvrmPreventCalculatorIds,
  cvrmPreventRegistryStatus,
} from "./registry";
import { isVerifiedCvrmPreventCalculator } from "./calculator-contract";
import { calculateScore2Risk, score2Calculator, score2TestVectors } from "./score2";

const expectRiskPercentClose = (actual: number, expected: number, tolerance = 0.3): void => {
  expect(actual).toBeGreaterThanOrEqual(expected - tolerance);
  expect(actual).toBeLessThanOrEqual(expected + tolerance);
};

describe("cvrm prevent calculator registry", () => {
  it("exports the verified SCORE2 calculator from labbie/U-Prevent data", () => {
    const registry = createCvrmPreventCalculatorRegistry();

    expect(cvrmPreventCalculatorIds).toEqual(["cvrm.score2"]);
    expect(cvrmPreventRegistryStatus).toEqual({
      status: "verified",
      calculatorCount: 1,
      exportsClinicalCalculators: true,
    });
    expect(registry.has("cvrm.score2")).toBe(true);
    expect(registry.list()).toHaveLength(1);
    expect(isVerifiedCvrmPreventCalculator(registry.get("cvrm.score2"))).toBe(true);
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

  it("keeps the registry source tied to real calculator definitions", () => {
    const source = readFileSync("packages/cvrm-prevent/src/registry.ts", "utf8");

    expect(source).toContain("score2Calculator");
    expect(source).not.toContain("createCalculatorRegistry([])");
  });
});
