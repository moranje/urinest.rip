import { describe, expect, it } from "vitest";
import {
  classifyGoldAbe,
  goldAbeCalculator,
  goldAbeSourceReferences,
  goldAbeTestVectors,
  validateGoldAbeInput,
} from "./gold-abe";

describe("GOLD ABE calculator", () => {
  it("classifies official ABE threshold vectors", () => {
    for (const vector of goldAbeTestVectors) {
      expect(classifyGoldAbe(vector.input)).toMatchObject(vector.expected);
    }
  });

  it("prioritizes exacerbation risk over symptom burden for group E", () => {
    expect(
      classifyGoldAbe({
        moderateExacerbationsPastYear: 1,
        severeExacerbationsPastYear: 0,
        catScore: 18,
      }).group,
    ).toBe("E");
  });

  it("rejects invalid shapes in registry validation and invalid ranges with clear errors", () => {
    expect(
      validateGoldAbeInput({
        moderateExacerbationsPastYear: 0,
        severeExacerbationsPastYear: 0,
        catScore: 8,
      }),
    ).toBe(true);
    expect(
      validateGoldAbeInput({
        moderateExacerbationsPastYear: -1,
        severeExacerbationsPastYear: 0,
        catScore: 8,
      }),
    ).toBe(false);
    expect(
      validateGoldAbeInput({ moderateExacerbationsPastYear: 0, severeExacerbationsPastYear: 0 }),
    ).toBe(true);

    expect(() =>
      classifyGoldAbe({ moderateExacerbationsPastYear: 0, severeExacerbationsPastYear: 0 }),
    ).toThrow("GOLD ABE classification requires CAT score or mMRC grade.");
    expect(() =>
      classifyGoldAbe({
        moderateExacerbationsPastYear: 0,
        severeExacerbationsPastYear: 0,
        catScore: 41,
      }),
    ).toThrow("CAT score must be between 0 and 40.");
  });

  it("keeps source references and test vectors attached to the calculator", () => {
    expect(goldAbeSourceReferences.map((reference) => reference.id)).toEqual([
      "gold-2026-report",
      "gold-2026-key-changes",
    ]);
    expect(goldAbeCalculator.sourceReferences).toHaveLength(2);
    expect(goldAbeCalculator.testVectors).toHaveLength(goldAbeTestVectors.length);
    expect(goldAbeCalculator.verificationStatus).toBe("verified");
  });
});
