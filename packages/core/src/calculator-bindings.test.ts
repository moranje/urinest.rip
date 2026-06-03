import { describe, expect, it } from "vitest";
import { createCalculatorRegistry } from "./calculator";
import {
  CalculatorBindingError,
  determineOutcomeWithCalculators,
  runCalculatorBindings,
} from "./calculator-bindings";
import type { ManifestCalculatorBinding } from "./manifest";

const score2Binding: ManifestCalculatorBinding = {
  id: "score2",
  calculatorId: "cvrm.score2",
  input: {
    age: { source: "answer", key: "q_age", coerce: "number" },
    sex: { source: "answer", key: "q_sex" },
    smoking: { source: "answer", key: "q_smoking", coerce: "boolean" },
    systolicBp: { source: "answer", key: "q_sbp", coerce: "number" },
    totalCholesterol: { source: "answer", key: "q_total_cholesterol", coerce: "number" },
    hdlCholesterol: { source: "answer", key: "q_hdl", coerce: "number" },
    region: { source: "context", key: "riskRegion", required: false },
  },
  outputs: {
    _score2_percent: { path: "riskPercent" },
    _score2_class: { path: "riskClass.label" },
  },
};

const registry = createCalculatorRegistry([
  {
    id: "cvrm.score2",
    calculate: (input) => {
      const scoreInput = input as Record<string, unknown>;
      return {
        model: Number(scoreInput.age) >= 70 ? "SCORE2-OP" : "SCORE2",
        riskPercent: Number(scoreInput.age) >= 60 ? 12.4 : 4.5,
        riskClass: { label: Number(scoreInput.age) >= 60 ? "hoog" : "laag-matig" },
        region: scoreInput.region ?? "low",
      };
    },
  },
]);

describe("calculator bindings", () => {
  it("maps answer and context inputs into virtual answers", async () => {
    const result = await runCalculatorBindings({
      registry,
      bindings: [score2Binding],
      context: { metadata: { riskRegion: "low" } },
      answers: {
        q_age: { value: "65", text: "65" },
        q_sex: { value: "M", text: "Man" },
        q_smoking: { value: "true", text: "Ja" },
        q_sbp: { value: "150", text: "150" },
        q_total_cholesterol: { value: "6", text: "6" },
        q_hdl: { value: "1", text: "1" },
      },
    });

    expect(result.calculations).toHaveLength(1);
    expect(result.calculations[0]?.input).toMatchObject({
      age: 65,
      sex: "M",
      smoking: true,
      region: "low",
    });
    expect(result.answers._score2_percent).toMatchObject({ value: 12.4, text: "12.4" });
    expect(result.answers._score2_class).toMatchObject({ value: "hoog", text: "hoog" });
  });

  it("uses virtual answers for outcome resolution", async () => {
    const result = await determineOutcomeWithCalculators({
      registry,
      calculatorBindings: [score2Binding],
      answers: {
        q_age: { value: "65", text: "65" },
        q_sex: { value: "M", text: "Man" },
        q_smoking: { value: "true", text: "Ja" },
        q_sbp: { value: "150", text: "150" },
        q_total_cholesterol: { value: "6", text: "6" },
        q_hdl: { value: "1", text: "1" },
      },
      resultsLogic: [
        {
          id: "score2-high",
          actionType: "showResult",
          resultKey: "intensive_cvrm",
          conditions: [{ questionId: "_score2_class", operator: "equals", value: "hoog" }],
        },
      ],
    });

    expect(result.outcome).toBe("result:intensive_cvrm");
    expect(result.ruleId).toBe("score2-high");
  });

  it("skips bindings when conditions are not met", async () => {
    const result = await runCalculatorBindings({
      registry,
      bindings: [
        {
          ...score2Binding,
          conditions: [{ questionId: "q_has_lipids", operator: "equals", value: "yes" }],
        },
      ],
      answers: { q_has_lipids: { value: "no", text: "Nee" } },
    });

    expect(result.calculations).toEqual([]);
    expect(result.answers).toEqual({ q_has_lipids: { value: "no", text: "Nee" } });
  });

  it("throws explicit errors for missing required inputs", async () => {
    await expect(
      runCalculatorBindings({
        registry,
        bindings: [score2Binding],
        answers: { q_age: { value: "65", text: "65" } },
      }),
    ).rejects.toThrow(CalculatorBindingError);

    await expect(
      runCalculatorBindings({
        registry,
        bindings: [score2Binding],
        answers: { q_age: { value: "65", text: "65" } },
      }),
    ).rejects.toThrow('Calculation "score2" missing required input "sex".');
  });
});
