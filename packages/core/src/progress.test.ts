import { describe, expect, it } from "vitest";
import { getQuestionProgress } from "./progress";

describe("getQuestionProgress", () => {
  it("returns a bounded fallback without questionnaire data", () => {
    expect(
      getQuestionProgress({
        questionnaire: null,
        currentQuestionId: "q1",
        questionHistory: [],
      }),
    ).toEqual({
      value: 1,
      max: 1,
      label: "Vraag 1 van 1",
      text: "Vraag 1/1",
    });
  });

  it("keeps conditional future questions out of the current branch estimate", () => {
    const progress = getQuestionProgress({
      questionnaire: {
        questionIds: ["q1", "q2", "q3"],
        questions: [
          { id: "q1" },
          { id: "q2", conditions: [{ questionId: "q1", operator: "equals", value: "yes" }] },
          { id: "q3" },
        ],
      },
      currentQuestionId: "q3",
      questionHistory: ["q1"],
      answers: { q1: { value: "no" } },
    });

    expect(progress.value).toBe(2);
    expect(progress.max).toBe(2);
    expect(progress.text).toBe("Vraag 2/2");
  });
});
