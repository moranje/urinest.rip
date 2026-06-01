import { describe, expect, it } from "vitest";
import {
  appendRedirectTrail,
  describeQuestionnaireGraph,
  detectRedirectCycle,
  findNextQuestion,
  findNextQuestionId,
  getQuestionnaireQuestionOrder,
  normalizeRedirectTrail,
} from "./graph";
import { createRuntimeContext } from "./runtime-context";
import type { ManifestQuestionnaire } from "./manifest";

const questionnaire = {
  id: "example-flow",
  version: "1",
  title: "Example",
  questions: [
    { id: "q1", text: "First", type: "select", options: [] },
    {
      id: "q2",
      text: "Second",
      type: "select",
      options: [],
      conditions: [{ questionId: "q1", operator: "equals", value: "show" }],
    },
    {
      id: "q3",
      text: "Third",
      type: "select",
      options: [],
      conditions: [{ questionId: "_role", operator: "equals", value: "clinician" }],
    },
  ],
  steps: [
    { id: "step-1", questionIds: ["q1"] },
    { id: "step-2", questionIds: ["q2", "q3"] },
  ],
  results: {
    done: { title: "Done" },
  },
  resultsLogic: [
    {
      id: "rule-1",
      conditions: [],
      actionType: "redirectToQuestionnaire",
      redirectToQuestionnaire: "other-flow",
    },
  ],
} satisfies ManifestQuestionnaire<{ title: string }>;

describe("questionnaire graph", () => {
  it("uses step order as traversal order", () => {
    expect(getQuestionnaireQuestionOrder(questionnaire)).toEqual(["q1", "q2", "q3"]);
  });

  it("falls back to question order when steps are absent", () => {
    expect(getQuestionnaireQuestionOrder({ questions: questionnaire.questions })).toEqual([
      "q1",
      "q2",
      "q3",
    ]);
  });

  it("finds the first visible question after a start question", () => {
    expect(findNextQuestionId({ questionnaire })).toBe("q1");
    expect(
      findNextQuestionId({
        questionnaire,
        startQuestionId: "q1",
        answers: { q1: { value: "hide" } },
      }),
    ).toBeNull();
    expect(
      findNextQuestionId({
        questionnaire,
        startQuestionId: "q1",
        answers: { q1: { value: "show" } },
      }),
    ).toBe("q2");
  });

  it("can return full question nodes with step metadata", () => {
    expect(findNextQuestion({ questionnaire })?.stepId).toBe("step-1");
  });

  it("can apply runtime context aliases before evaluating question visibility", () => {
    expect(
      findNextQuestionId({
        questionnaire,
        startQuestionId: "q2",
        runtimeContext: createRuntimeContext({ role: "clinician" }),
        contextAliases: { role: "_role" },
      }),
    ).toBe("q3");
  });

  it("detects redirect cycles and returns the full chain", () => {
    expect(detectRedirectCycle(["first-flow", "second-flow"], "third-flow")).toEqual({
      hasCycle: false,
      chain: ["first-flow", "second-flow", "third-flow"],
    });
    expect(detectRedirectCycle(["first-flow", "second-flow"], "first-flow")).toEqual({
      hasCycle: true,
      chain: ["first-flow", "second-flow", "first-flow"],
    });
  });

  it("normalizes and appends redirect trails without owning storage", () => {
    expect(normalizeRedirectTrail(null, "first-flow", { now: 10 })).toEqual({
      flows: ["first-flow"],
      updatedAt: 10,
    });
    expect(
      normalizeRedirectTrail(
        { flows: ["first-flow", "second-flow", "third-flow"], updatedAt: 10 },
        "second-flow",
        { now: 20, ttlMs: 100 },
      ),
    ).toEqual({ flows: ["first-flow", "second-flow"], updatedAt: 10 });
    expect(
      appendRedirectTrail({ flows: ["first-flow"], updatedAt: 10 }, "second-flow", { now: 20 }),
    ).toEqual({
      type: "ok",
      trail: { flows: ["first-flow", "second-flow"], updatedAt: 20 },
    });
    expect(appendRedirectTrail({ flows: ["first-flow"], updatedAt: 10 }, "first-flow")).toEqual({
      type: "cycle",
      trail: { flows: ["first-flow", "first-flow"], updatedAt: 10 },
      cycle: ["first-flow", "first-flow"],
    });
  });

  it("describes graph nodes and redirect targets", () => {
    expect(describeQuestionnaireGraph(questionnaire)).toEqual({
      questionIds: ["q1", "q2", "q3"],
      stepIds: ["step-1", "step-2"],
      resultKeys: ["done"],
      redirectTargets: ["other-flow"],
    });
  });
});
