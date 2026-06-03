import { describe, expect, it } from "vitest";
import {
  convertHba1c,
  hba1cConversionCalculator,
  hba1cSourceReferences,
  hba1cTestVectors,
  validateHba1cConversionInput,
} from "./hba1c";

const expectClose = (actual: number, expected: number, tolerance = 0.2): void => {
  expect(actual).toBeGreaterThanOrEqual(expected - tolerance);
  expect(actual).toBeLessThanOrEqual(expected + tolerance);
};

describe("HbA1c conversion calculator", () => {
  it("converts official NGSP/IFCC table vectors", () => {
    for (const vector of hba1cTestVectors) {
      const result = convertHba1c(vector.input);
      const tolerance = vector.tolerance ?? 0.2;

      expectClose(result.ifccMmolMol, vector.expected.ifccMmolMol, tolerance);
      expectClose(result.ngspPercent, vector.expected.ngspPercent, tolerance);
      expectClose(result.eAgMgDl, vector.expected.eAgMgDl, tolerance);
      expectClose(result.eAgMmolL, vector.expected.eAgMmolL, tolerance);
      expect(result.sourceReferenceIds).toContain(vector.sourceReferenceId);
    }
  });

  it("supports precision overrides without changing the formula version", () => {
    const result = convertHba1c({
      unit: "ifcc_mmol_mol",
      value: 53,
      precision: { ngspPercent: 2, eAgMmolL: 2 },
    });

    expect(result.ngspPercent).toBe(7);
    expect(result.eAgMmolL).toBe(8.56);
    expect(result.formulaVersion).toBe("ngsp-ifcc-master-equation-adag-2008");
  });

  it("rejects invalid shapes in registry validation and invalid ranges with clear errors", () => {
    expect(validateHba1cConversionInput({ unit: "ifcc_mmol_mol", value: 53 })).toBe(true);
    expect(validateHba1cConversionInput({ unit: "ifcc", value: 53 })).toBe(false);
    expect(validateHba1cConversionInput({ unit: "ngsp_percent", value: "7" })).toBe(false);

    expect(() => convertHba1c({ unit: "ifcc_mmol_mol", value: 0 })).toThrow(
      "HbA1c conversion requires a positive value.",
    );
    expect(() => convertHba1c({ unit: "ngsp_percent", value: 21 })).toThrow(
      "HbA1c NGSP input must be <= 20%.",
    );
  });

  it("keeps source references and test vectors attached to the calculator", () => {
    expect(hba1cSourceReferences.map((reference) => reference.id)).toEqual([
      "ngsp-ifcc-standardization",
    ]);
    expect(hba1cConversionCalculator.sourceReferences).toHaveLength(1);
    expect(hba1cConversionCalculator.testVectors).toHaveLength(hba1cTestVectors.length);
    expect(hba1cConversionCalculator.verificationStatus).toBe("verified");
  });
});
