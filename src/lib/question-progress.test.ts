import { describe, expect, it } from "vitest";
import { getQuestionProgress } from "./question-progress";
import type { Condition } from "../types";

const answer = (value: string) => ({ value, text: value });
const condition = (
  questionId: string,
  operator: Condition["operator"],
  value: string,
): Condition => ({
  questionId,
  operator,
  value,
});

describe("getQuestionProgress", () => {
  const questionnaire = {
    questionIds: ["q1", "q2", "q3"],
    questions: [
      { id: "q1" },
      { id: "q2", conditions: [condition("q1", "equals", "go")] },
      { id: "q3", conditions: [condition("q1", "equals", "stop")] },
    ],
  };

  it("keeps unanswered future branches in the estimate", () => {
    const progress = getQuestionProgress({
      questionnaire,
      currentQuestionId: "q1",
      questionHistory: [],
      answers: {},
    });

    expect(progress).toEqual({
      value: 1,
      max: 3,
      label: "Vraag 1 van ongeveer 3",
      text: "Vraag 1/3",
    });
  });

  it("removes branches that are ruled out by current answers", () => {
    const progress = getQuestionProgress({
      questionnaire,
      currentQuestionId: "q2",
      questionHistory: ["q1"],
      answers: { q1: answer("go") },
    });

    expect(progress).toEqual({
      value: 2,
      max: 2,
      label: "Vraag 2 van ongeveer 2",
      text: "Vraag 2/2",
    });
  });

  it("uses questionIds when full question details are unavailable", () => {
    const progress = getQuestionProgress({
      questionnaire: { questionIds: ["q1", "q2", "q3"] },
      currentQuestionId: "q2",
      questionHistory: ["q1"],
    });

    expect(progress.max).toBe(3);
  });

  it("supports include and exclude conditions for multi-select answers", () => {
    const progress = getQuestionProgress({
      questionnaire: {
        questionIds: ["q1", "q2", "q3"],
        questions: [
          { id: "q1" },
          { id: "q2", conditions: [condition("q1", "includes", "a")] },
          { id: "q3", conditions: [condition("q1", "not_includes", "b")] },
        ],
      },
      currentQuestionId: "q2",
      questionHistory: ["q1"],
      answers: { q1: [answer("a")] },
    });

    expect(progress.max).toBe(3);
  });
});
