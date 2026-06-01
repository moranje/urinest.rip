import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  DecisionManifest,
  ManifestQuestion,
  ManifestQuestionnaire,
  NormalizedDecisionManifest,
} from "./manifest";

interface ExampleResult {
  title: string;
  severity?: "low" | "high";
}

describe("manifest types", () => {
  it("models generic flow manifests without domain data", () => {
    const question = {
      id: "q1",
      text: "Question",
      type: "select",
      options: [{ id: "yes", value: "yes", text: "Yes" }],
    } satisfies ManifestQuestion<string>;

    const questionnaire = {
      id: "example-flow",
      version: "1",
      title: "Example flow",
      questions: [question],
      steps: [{ id: "step-1", questionIds: ["q1"] }],
      results: {
        primary: { title: "Primary", severity: "low" },
      },
      resultsLogic: [
        {
          id: "rule-1",
          conditions: [{ questionId: "q1", operator: "equals", value: "yes" }],
          actionType: "result",
          resultKey: "primary",
        },
      ],
    } satisfies ManifestQuestionnaire<ExampleResult>;

    const manifest = { questionnaires: [questionnaire] } satisfies DecisionManifest<ExampleResult>;

    expect(manifest.questionnaires[0]?.results?.primary?.title).toBe("Primary");
    expectTypeOf(manifest).toMatchTypeOf<DecisionManifest<ExampleResult>>();
  });

  it("models normalized manifest maps", () => {
    const normalized = {
      questionnaires: {
        "example-flow": {
          id: "example-flow",
          version: "1",
          title: "Example flow",
          questionIds: ["q1"],
          stepIds: ["step-1"],
          resultsLogicIds: ["rule-1"],
        },
      },
      questions: {
        q1: { id: "q1", text: "Question", type: "select", options: [] },
      },
      steps: {
        "step-1": { id: "step-1", questionIds: ["q1"] },
      },
      results: {
        primary: { title: "Primary" },
      },
      resultsLogic: {
        "rule-1": {
          id: "rule-1",
          conditions: [],
          actionType: "result",
          resultKey: "primary",
        },
      },
    } satisfies NormalizedDecisionManifest<ExampleResult>;

    expect(normalized.questionnaires["example-flow"].questionIds).toEqual(["q1"]);
    expectTypeOf(normalized).toMatchTypeOf<NormalizedDecisionManifest<ExampleResult>>();
  });
});
