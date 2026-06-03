import { describe, expect, it } from "vitest";
import {
  QUESTION_ROUTE_QUERY_KEY,
  buildQuestionRouteHistory,
  createQuestionRouteLocation,
  createResultRouteLocation,
  readQuestionRouteQuery,
} from "./question-route";

describe("question route helpers", () => {
  it("reads the active question id from route query", () => {
    expect(readQuestionRouteQuery({ [QUESTION_ROUTE_QUERY_KEY]: "q_start" })).toBe("q_start");
    expect(readQuestionRouteQuery({ [QUESTION_ROUTE_QUERY_KEY]: "" })).toBeNull();
    expect(readQuestionRouteQuery({ [QUESTION_ROUTE_QUERY_KEY]: ["q_start"] })).toBeNull();
  });

  it("creates questionnaire locations that preserve unrelated query params", () => {
    expect(createQuestionRouteLocation("strip", "q_nitrite", { mode: "triage" })).toEqual({
      name: "Questionnaire",
      params: { id: "strip" },
      query: { mode: "triage", q: "q_nitrite" },
    });
  });

  it("creates result locations without a synthetic back target", () => {
    expect(createResultRouteLocation("uti.local")).toEqual({
      name: "Result",
      params: { resultKey: "uti.local" },
      query: {},
    });
  });

  it("reconstructs browser history for a routed question", () => {
    const nextByQuestion = new Map<string | null, string | null>([
      [null, "q1"],
      ["q1", "q2"],
      ["q2", "q3"],
      ["q3", null],
    ]);

    expect(
      buildQuestionRouteHistory({
        findNextQuestionId: (questionId) => nextByQuestion.get(questionId) ?? null,
        questionIds: ["q1", "q2", "q3"],
        targetQuestionId: "q3",
      }),
    ).toEqual(["q1", "q2"]);
  });

  it("rejects unreachable or cyclic routed questions", () => {
    expect(
      buildQuestionRouteHistory({
        findNextQuestionId: () => "q1",
        questionIds: ["q1", "q2"],
        targetQuestionId: "q2",
      }),
    ).toBeNull();

    expect(
      buildQuestionRouteHistory({
        findNextQuestionId: () => "q1",
        questionIds: ["q1"],
        targetQuestionId: "missing",
      }),
    ).toBeNull();
  });
});
