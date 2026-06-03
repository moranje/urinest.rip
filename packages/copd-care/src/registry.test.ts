import { readFileSync } from "node:fs";
import { isVerifiedCalculatorDefinition } from "@beslismodel/core";
import { describe, expect, it } from "vitest";
import { goldAbeCalculator, goldAbeTestVectors } from "./gold-abe";
import {
  copdCareCalculatorIds,
  copdCareRegistryStatus,
  createCopdCareCalculatorRegistry,
} from "./registry";

describe("copd care calculator registry", () => {
  it("exports the verified GOLD ABE calculator", async () => {
    const registry = createCopdCareCalculatorRegistry();

    expect(copdCareCalculatorIds).toEqual(["copd.gold_abe"]);
    expect(copdCareRegistryStatus).toEqual({
      status: "verified",
      calculatorCount: 1,
      exportsClinicalCalculators: true,
    });
    expect(registry.has("copd.gold_abe")).toBe(true);
    expect(registry.list()).toHaveLength(1);
    expect(isVerifiedCalculatorDefinition(registry.get("copd.gold_abe"))).toBe(true);

    const result = await registry.run("copd.gold_abe", goldAbeTestVectors[3].input);
    expect(result).toMatchObject(goldAbeTestVectors[3].expected);
  });

  it("does not accept unverified calculator definitions as verified calculators", () => {
    expect(
      isVerifiedCalculatorDefinition({
        id: "copd.gold_abe",
        calculate: () => ({ group: "E" }),
      }),
    ).toBe(false);
  });

  it("keeps the registry source tied to real calculator definitions", () => {
    const source = readFileSync("packages/copd-care/src/registry.ts", "utf8");

    expect(source).toContain("goldAbeCalculator");
    expect(source).not.toContain("createCalculatorRegistry([])");
    expect(goldAbeCalculator.id).toBe("copd.gold_abe");
  });
});
