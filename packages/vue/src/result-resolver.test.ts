import { describe, expect, it, vi } from "vitest";
import { useResultResolver, type BeslismodelResultResolverStore } from "./result-resolver";
import type { BeslismodelOutcomeResult } from "./store";

interface TestAnswer {
  value: string;
  text: string;
}

interface TestRule {
  id: string;
}

const createStore = (
  outcome: BeslismodelOutcomeResult,
): BeslismodelResultResolverStore<TestAnswer, TestRule> => ({
  determineOutcomeForPath: vi.fn(() => outcome),
  getAllAnswersForQuestionnaire: vi.fn(() => ({
    q1: { value: "yes", text: "Yes" },
  })),
  getFullQuestionnaire: vi.fn((questionnaireId: string) =>
    questionnaireId === "missing"
      ? null
      : {
          resultsLogic: [{ id: "rule-1" }],
        },
  ),
});

describe("useResultResolver", () => {
  it("resolves result outcomes", () => {
    const store = createStore({ outcome: "result:bacteriurie.primary", ruleId: "rule-1" });
    const resolver = useResultResolver(store);

    const result = resolver.resolveResult("strip");

    expect(result).toEqual({
      answeredQuestionIds: ["q1"],
      questionnaireId: "strip",
      rawOutcome: { outcome: "result:bacteriurie.primary", ruleId: "rule-1" },
      resultKey: "bacteriurie.primary",
      ruleId: "rule-1",
      type: "result",
      typedOutcome: {
        key: "bacteriurie.primary",
        raw: "result:bacteriurie.primary",
        type: "result",
      },
    });
    expect(resolver.lastResult.value).toEqual(result);
    expect(resolver.error.value).toBeNull();
  });

  it("resolves redirect outcomes", () => {
    const store = createStore({ outcome: "redirect:leukocyturie", ruleId: "rule-2" });
    const resolver = useResultResolver(store);

    expect(resolver.resolveResult("strip")).toEqual(
      expect.objectContaining({
        targetQuestionnaireId: "leukocyturie",
        type: "redirect",
        typedOutcome: {
          raw: "redirect:leukocyturie",
          target: "leukocyturie",
          type: "redirect",
        },
      }),
    );
  });

  it("resolves empty outcomes as none", () => {
    const store = createStore({ outcome: null, ruleId: null });
    const resolver = useResultResolver(store);

    expect(resolver.resolveResult("strip")).toEqual(
      expect.objectContaining({
        ruleId: null,
        type: "none",
        typedOutcome: {
          raw: null,
          type: "none",
        },
      }),
    );
  });

  it("accepts answer overrides without mutating the store answers", () => {
    const store = createStore({ outcome: "result:override", ruleId: "rule-override" });
    const resolver = useResultResolver(store);
    const overrideAnswers = {
      q2: { value: "override", text: "Override" },
    };

    const result = resolver.resolveResult("strip", { answers: overrideAnswers });

    expect(result.answeredQuestionIds).toEqual(["q2"]);
    expect(store.getAllAnswersForQuestionnaire).not.toHaveBeenCalled();
    expect(store.determineOutcomeForPath).toHaveBeenCalledWith("strip", overrideAnswers, [
      { id: "rule-1" },
    ]);
  });

  it("throws on missing questionnaires", () => {
    const store = createStore({ outcome: "result:x", ruleId: "rule-1" });
    const resolver = useResultResolver(store);

    expect(() => resolver.resolveResult("missing")).toThrow("Unknown questionnaire: missing");
    expect(resolver.error.value).toEqual(new Error("Unknown questionnaire: missing"));
  });

  it("throws and stores malformed outcome errors", () => {
    const store = createStore({ outcome: "unknown:x", ruleId: "rule-1" });
    const resolver = useResultResolver(store);

    expect(() => resolver.resolveResult("strip")).toThrow("Unsupported outcome type: unknown");
    expect(resolver.lastResult.value).toBeNull();
    expect(resolver.error.value?.message).toBe("Unsupported outcome type: unknown");
  });
});
