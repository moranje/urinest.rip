import { describe, expect, it } from "vitest";
import { createCalculatorRegistry } from "./calculator";
import {
  CalculatorBindingError,
  determineOutcomeWithCalculators,
  runCalculatorBindings,
} from "./calculator-bindings";
import type { ManifestCalculatorBinding } from "./manifest";

const scoreBandBinding: ManifestCalculatorBinding = {
  id: "score-band",
  calculatorId: "score.band",
  input: {
    points: { source: "answer", key: "q_points", coerce: "number" },
    weight: { source: "answer", key: "q_weight", coerce: "number" },
    enabled: { source: "answer", key: "q_enabled", coerce: "boolean" },
    profile: { source: "context", key: "scoreProfile", required: false },
  },
  outputs: {
    _score_total: { path: "total" },
    _score_band: { path: "band.label" },
  },
};

const registry = createCalculatorRegistry([
  {
    id: "score.band",
    calculate: (input) => {
      const scoreInput = input as Record<string, unknown>;
      const total = Number(scoreInput.points) * Number(scoreInput.weight);
      return {
        band: { label: total >= 10 ? "high" : "low" },
        enabled: scoreInput.enabled,
        profile: scoreInput.profile ?? "default",
        total,
      };
    },
  },
]);

describe("calculator bindings", () => {
  it("maps answer and context inputs into virtual answers", async () => {
    const result = await runCalculatorBindings({
      registry,
      bindings: [scoreBandBinding],
      context: { metadata: { scoreProfile: "default" } },
      answers: {
        q_enabled: { value: "true", text: "Ja" },
        q_points: { value: "5", text: "5" },
        q_weight: { value: "3", text: "3" },
      },
    });

    expect(result.calculations).toHaveLength(1);
    expect(result.calculations[0]?.input).toMatchObject({
      enabled: true,
      points: 5,
      profile: "default",
      weight: 3,
    });
    expect(result.answers._score_total).toMatchObject({ value: 15, text: "15" });
    expect(result.answers._score_band).toMatchObject({ value: "high", text: "high" });
  });

  it("uses virtual answers for outcome resolution", async () => {
    const result = await determineOutcomeWithCalculators({
      registry,
      calculatorBindings: [scoreBandBinding],
      answers: {
        q_enabled: { value: "true", text: "Ja" },
        q_points: { value: "5", text: "5" },
        q_weight: { value: "3", text: "3" },
      },
      resultsLogic: [
        {
          id: "score-band-high",
          actionType: "showResult",
          resultKey: "high_score_follow_up",
          conditions: [{ questionId: "_score_band", operator: "equals", value: "high" }],
        },
      ],
    });

    expect(result.outcome).toBe("result:high_score_follow_up");
    expect(result.ruleId).toBe("score-band-high");
  });

  it("skips bindings when conditions are not met", async () => {
    const result = await runCalculatorBindings({
      registry,
      bindings: [
        {
          ...scoreBandBinding,
          conditions: [{ questionId: "q_can_score", operator: "equals", value: "yes" }],
        },
      ],
      answers: { q_can_score: { value: "no", text: "Nee" } },
    });

    expect(result.calculations).toEqual([]);
    expect(result.answers).toEqual({ q_can_score: { value: "no", text: "Nee" } });
  });

  it("throws explicit errors for missing required inputs", async () => {
    await expect(
      runCalculatorBindings({
        registry,
        bindings: [scoreBandBinding],
        answers: { q_points: { value: "5", text: "5" } },
      }),
    ).rejects.toThrow(CalculatorBindingError);

    await expect(
      runCalculatorBindings({
        registry,
        bindings: [scoreBandBinding],
        answers: { q_points: { value: "5", text: "5" } },
      }),
    ).rejects.toThrow('Calculation "score-band" missing required input "weight".');
  });
});
