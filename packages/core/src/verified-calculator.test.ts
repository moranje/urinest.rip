import { describe, expect, it } from "vitest";
import type { CalculatorDefinition } from "./calculator";
import {
  isVerifiedCalculatorDefinition,
  validateVerifiedCalculator,
  type VerifiedCalculatorDefinition,
} from "./verified-calculator";

const verifiedCalculator: VerifiedCalculatorDefinition<{ value: number }, { doubled: number }> = {
  id: "test.double",
  formulaVersion: "2026.1",
  sourceReferences: [
    {
      id: "source",
      title: "Domain source",
      url: "https://example.test/domain-source",
      version: "2026",
    },
  ],
  testVectors: [
    {
      id: "vector-1",
      input: { value: 2 },
      expected: { doubled: 4 },
      sourceReferenceId: "source",
    },
  ],
  verificationStatus: "verified",
  calculate: (input) => ({ doubled: input.value * 2 }),
};

describe("verified calculator contract", () => {
  it("accepts calculators with formula version, source references and test vectors", () => {
    expect(isVerifiedCalculatorDefinition(verifiedCalculator)).toBe(true);
    expect(validateVerifiedCalculator(verifiedCalculator)).toEqual({
      errors: [],
      valid: true,
    });
  });

  it("rejects ad-hoc calculators without verification evidence", () => {
    const calculator: CalculatorDefinition = {
      id: "test.unverified",
      calculate: () => ({ ok: true }),
    };

    const result = validateVerifiedCalculator(calculator);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("verificationStatus must be verified");
    expect(result.errors).toContain("formulaVersion must be present");
    expect(result.errors).toContain("sourceReferences must be non-empty");
    expect(result.errors).toContain("testVectors must be non-empty");
  });

  it("requires test vectors to reference declared sources", () => {
    const calculatorWithMissingSource: VerifiedCalculatorDefinition<
      { value: number },
      { doubled: number }
    > = {
      ...verifiedCalculator,
      testVectors: [
        {
          id: "orphan",
          input: { value: 1 },
          expected: { doubled: 2 },
          sourceReferenceId: "missing",
        },
      ],
    };

    const result = validateVerifiedCalculator(calculatorWithMissingSource);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("testVector orphan references unknown source missing");
  });
});
