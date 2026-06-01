import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  DecisionManifest,
  ManifestQuestion,
  ManifestQuestionnaire,
  NormalizedDecisionManifest,
} from "./manifest";
import { normalizeDecisionManifest } from "./manifest";

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

  it("normalizes questionnaires into entity maps", () => {
    const normalized = normalizeDecisionManifest<ExampleResult>({
      questionnaires: [
        {
          id: "example-flow",
          version: "1",
          name: "Example",
          title: "Example flow",
          hiddenFromLandingPage: false,
          questions: [
            { id: "q1", text: "Question", type: "select", options: [] },
            { id: "q2", text: "Follow-up", type: "select", options: [] },
          ],
          steps: [{ id: "step-1", questionIds: ["q1", "q2"] }],
          results: {
            primary: { title: "Primary", severity: "high" },
          },
          resultsLogic: [
            {
              conditions: [{ questionId: "q1", operator: "equals", value: "yes" }],
              actionType: "result",
              resultKey: "primary",
            },
            {
              id: "custom-rule",
              conditions: [],
              actionType: "redirect",
              redirectToQuestionnaire: "other-flow",
            },
          ],
        },
      ],
    });

    expect(normalized.questionnaires["example-flow"]).toEqual({
      id: "example-flow",
      version: "1",
      name: "Example",
      title: "Example flow",
      description: undefined,
      icon: undefined,
      hiddenFromLandingPage: false,
      questionIds: ["q1", "q2"],
      stepIds: ["step-1"],
      resultsLogicIds: ["example-flow-rule-0", "custom-rule"],
      metadata: undefined,
    });
    expect(normalized.questions.q1?.text).toBe("Question");
    expect(normalized.steps["step-1"]?.questionIds).toEqual(["q1", "q2"]);
    expect(normalized.results.primary).toEqual({ title: "Primary", severity: "high" });
    expect(normalized.resultsLogic["example-flow-rule-0"]?.id).toBe("example-flow-rule-0");
    expect(normalized.resultsLogic["custom-rule"]?.redirectToQuestionnaire).toBe("other-flow");
  });

  it("rejects duplicate entity ids during normalization", () => {
    expect(() =>
      normalizeDecisionManifest({
        questionnaires: [
          {
            id: "example-flow",
            version: "1",
            title: "Example flow",
            questions: [
              { id: "q1", text: "Question", type: "select", options: [] },
              { id: "q1", text: "Duplicate", type: "select", options: [] },
            ],
          },
        ],
      }),
    ).toThrow("Duplicate question id: q1");
  });

  it("can preserve legacy flat-map overwrite behavior explicitly", () => {
    const normalized = normalizeDecisionManifest(
      {
        questionnaires: [
          {
            id: "first-flow",
            version: "1",
            title: "First",
            results: { shared: { title: "First result" } },
          },
          {
            id: "second-flow",
            version: "1",
            title: "Second",
            results: { shared: { title: "Second result" } },
          },
        ],
      },
      { duplicateIdPolicy: "overwrite" },
    );

    expect(normalized.results.shared).toEqual({ title: "Second result" });
  });
});
