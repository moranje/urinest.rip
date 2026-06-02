import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const plan = readFileSync("docs/framework-package-plan-2026-06-01.md", "utf8");
const security = readFileSync("docs/framework-security-privacy.md", "utf8");
const calculatorSource = readFileSync("packages/core/src/calculator.ts", "utf8");

describe("domain calculator package boundary", () => {
  it("keeps core calculator APIs generic and domain calculators in consumer packages", () => {
    expect(plan).toContain("Domein-agnostisch calculator extensiecontract");
    expect(plan).toContain("Geen CVRM/PREVENT-specifieke calculator-API");
    expect(plan).toContain(
      "Domeinspecifieke data, calculatorimplementaties en richtlijnadapters leven buiten core.",
    );
    expect(security).toContain("Calculatorformules zitten in domain packages met testvectors.");

    expect(calculatorSource).toContain("CalculatorDefinition");
    expect(calculatorSource).toContain("createCalculatorRegistry");
    expect(calculatorSource).not.toMatch(/\b(CVRM|PREVENT|COPD|diabetes|SCORE2)\b/i);
  });
});
