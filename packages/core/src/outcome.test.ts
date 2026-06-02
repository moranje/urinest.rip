import { describe, expect, it } from "vitest";
import { determineOutcome, parseOutcome, toLegacyOutcome, type OutcomeLogicRule } from "./outcome";

describe("parseOutcome", () => {
  it("parses redirect outcomes", () => {
    expect(parseOutcome("redirect:next-flow")).toEqual({
      type: "redirect",
      target: "next-flow",
      raw: "redirect:next-flow",
    });
  });

  it("parses result outcomes", () => {
    expect(parseOutcome("result:example.outcome.primary")).toEqual({
      type: "result",
      key: "example.outcome.primary",
      raw: "result:example.outcome.primary",
    });
  });

  it("parses empty outcomes as none", () => {
    expect(parseOutcome(null)).toEqual({ type: "none", raw: null });
  });

  it("rejects malformed outcomes", () => {
    expect(() => parseOutcome("redirect:")).toThrow("Malformed outcome");
    expect(() => parseOutcome("unknown:value")).toThrow("Unsupported outcome type");
  });

  it("can serialize back to legacy outcome strings", () => {
    expect(toLegacyOutcome(parseOutcome("result:abc"))).toBe("result:abc");
    expect(toLegacyOutcome(parseOutcome(null))).toBeNull();
  });
});

describe("determineOutcome", () => {
  const answer = (value: string) => ({ value, text: value });

  it("returns the most specific matching result rule", () => {
    const rules: OutcomeLogicRule[] = [
      {
        id: "default",
        actionType: "showResult",
        conditions: [],
        resultKey: "default-result",
      },
      {
        id: "specific",
        actionType: "showResult",
        conditions: [{ questionId: "q1", operator: "equals", value: "yes" }],
        resultKey: "specific-result",
      },
    ];

    expect(determineOutcome({ q1: answer("yes") }, rules)).toEqual({
      outcome: "result:specific-result",
      ruleId: "specific",
    });
  });

  it("returns redirect outcomes for questionnaire redirects", () => {
    expect(
      determineOutcome({ q1: answer("positive") }, [
        {
          id: "redirect-rule",
          actionType: "redirectToQuestionnaire",
          conditions: [{ questionId: "q1", operator: "equals", value: "positive" }],
          redirectToQuestionnaire: "bacteriurie",
        },
      ]),
    ).toEqual({
      outcome: "redirect:bacteriurie",
      ruleId: "redirect-rule",
    });
  });

  it("falls back to a default rule when no conditional rule matches", () => {
    expect(
      determineOutcome({ q1: answer("negative") }, [
        {
          id: "specific",
          actionType: "showResult",
          conditions: [{ questionId: "q1", operator: "equals", value: "positive" }],
          resultKey: "specific-result",
        },
        {
          id: "default",
          actionType: "showResult",
          conditions: [],
          resultKey: "default-result",
        },
      ]),
    ).toEqual({
      outcome: "result:default-result",
      ruleId: "default",
    });
  });

  it("returns no outcome when no rule can produce an outcome", () => {
    expect(determineOutcome({}, [])).toEqual({ outcome: null, ruleId: null });
    expect(
      determineOutcome({}, [{ id: "empty-action", actionType: "custom", conditions: [] }]),
    ).toEqual({
      outcome: null,
      ruleId: "empty-action",
    });
  });
});
