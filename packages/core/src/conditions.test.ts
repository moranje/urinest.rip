import { describe, expect, it } from "vitest";
import { evaluateCondition, validateConditions } from "./conditions";

describe("condition validation", () => {
  it("validates empty condition lists", () => {
    expect(validateConditions({}, [])).toEqual({ isValid: true, matchedCount: 0 });
    expect(validateConditions({}, null)).toEqual({ isValid: true, matchedCount: 0 });
  });

  it("evaluates equality operators with string coercion", () => {
    expect(
      evaluateCondition(
        { answer: { value: 1 } },
        { questionId: "answer", operator: "equals", value: "1" },
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        { answer: { value: 1 } },
        { questionId: "answer", operator: "not_equals", value: "2" },
      ),
    ).toBe(true);
  });

  it("evaluates array membership operators", () => {
    expect(
      evaluateCondition(
        { answer: "b" },
        { questionId: "answer", operator: "in", value: ["a", "b"] },
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        { answer: "c" },
        { questionId: "answer", operator: "not_in", value: ["a", "b"] },
      ),
    ).toBe(true);
  });

  it("evaluates multi-answer includes operators", () => {
    const answers = { answer: [{ value: "a" }, { value: 2 }] };

    expect(
      evaluateCondition(answers, { questionId: "answer", operator: "includes", value: "2" }),
    ).toBe(true);
    expect(
      evaluateCondition(answers, { questionId: "answer", operator: "not_includes", value: "z" }),
    ).toBe(true);
  });

  it("returns invalid when any condition fails", () => {
    expect(
      validateConditions({ first: "yes", second: "no" }, [
        { questionId: "first", operator: "equals", value: "yes" },
        { questionId: "second", operator: "equals", value: "yes" },
      ]),
    ).toEqual({ isValid: false, matchedCount: 0 });
  });

  it("counts matches only when all conditions pass", () => {
    expect(
      validateConditions({ first: "yes", second: "no" }, [
        { questionId: "first", operator: "equals", value: "yes" },
        { questionId: "second", operator: "not_equals", value: "yes" },
      ]),
    ).toEqual({ isValid: true, matchedCount: 2 });
  });

  it("rejects missing answers and unknown operators", () => {
    expect(evaluateCondition({}, { questionId: "missing", operator: "equals", value: "yes" })).toBe(
      false,
    );
    expect(
      evaluateCondition(
        { answer: "yes" },
        { questionId: "answer", operator: "unknown", value: "yes" },
      ),
    ).toBe(false);
  });
});
