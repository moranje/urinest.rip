import { readFileSync } from "node:fs";
import { isVerifiedCalculatorDefinition } from "@beslismodel/core";
import { describe, expect, it } from "vitest";
import { hba1cConversionCalculator, hba1cTestVectors } from "./hba1c";
import {
  createDmCareCalculatorRegistry,
  dmCareCalculatorIds,
  dmCareRegistryStatus,
} from "./registry";

describe("dm care calculator registry", () => {
  it("exports the verified HbA1c calculator", async () => {
    const registry = createDmCareCalculatorRegistry();

    expect(dmCareCalculatorIds).toEqual(["dm.hba1c_conversion"]);
    expect(dmCareRegistryStatus).toEqual({
      status: "verified",
      calculatorCount: 1,
      exportsClinicalCalculators: true,
    });
    expect(registry.has("dm.hba1c_conversion")).toBe(true);
    expect(registry.list()).toHaveLength(1);
    expect(isVerifiedCalculatorDefinition(registry.get("dm.hba1c_conversion"))).toBe(true);

    const result = await registry.run("dm.hba1c_conversion", hba1cTestVectors[2].input);
    expect(result).toMatchObject(hba1cTestVectors[2].expected);
  });

  it("does not accept unverified calculator definitions as verified calculators", () => {
    expect(
      isVerifiedCalculatorDefinition({
        id: "dm.hba1c_conversion",
        calculate: () => ({ ifccMmolMol: 53 }),
      }),
    ).toBe(false);
  });

  it("keeps the registry source tied to real calculator definitions", () => {
    const source = readFileSync("packages/dm-care/src/registry.ts", "utf8");

    expect(source).toContain("hba1cConversionCalculator");
    expect(source).not.toContain("createCalculatorRegistry([])");
    expect(hba1cConversionCalculator.id).toBe("dm.hba1c_conversion");
  });
});
