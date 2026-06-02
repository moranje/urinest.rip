import { describe, expect, it } from "vitest";
import {
  assertClinicalSafetyFixtures,
  createManifestSnapshot,
  createNormalizedManifestSnapshot,
  createStableSnapshot,
  evaluateClinicalSafetyFixtures,
  type ClinicalSafetyFixture,
} from "./index";

const manifest = {
  metadata: { z: "last", a: "first" },
  questionnaires: [
    {
      id: "strip",
      version: "1",
      title: "Urinestrip",
      questions: [
        { id: "q_nitrite", text: "Nitriet?", type: "select", options: [] },
        { id: "q_leukocytes", text: "Leuko?", type: "select", options: [] },
      ],
      steps: [{ id: "step-strip", questionIds: ["q_nitrite", "q_leukocytes"] }],
      results: {
        normal: { title: "Geen afwijking" },
      },
      resultsLogic: [
        {
          id: "rule-redirect",
          actionType: "redirect",
          conditions: [{ questionId: "q_nitrite", operator: "equals", value: "positive" }],
          redirectToQuestionnaire: "bacteriurie",
        },
        {
          actionType: "result",
          conditions: [{ questionId: "q_nitrite", operator: "equals", value: "negative" }],
          resultKey: "normal",
        },
      ],
    },
  ],
} as const;

describe("@beslismodel/testing snapshots", () => {
  it("creates stable snapshots with sorted object keys", () => {
    expect(createStableSnapshot({ z: 1, a: { y: true, b: "x" } })).toEqual({
      a: { b: "x", y: true },
      z: 1,
    });
  });

  it("creates manifest snapshots focused on public flow structure", () => {
    expect(createManifestSnapshot(manifest)).toEqual({
      metadata: { a: "first", z: "last" },
      questionnaireIds: ["strip"],
      questionnaires: [
        expect.objectContaining({
          id: "strip",
          questionIds: ["q_leukocytes", "q_nitrite"],
          redirects: ["bacteriurie"],
          resultKeys: ["normal"],
          stepIds: ["step-strip"],
        }),
      ],
    });
  });

  it("creates normalized manifest snapshots", () => {
    expect(createNormalizedManifestSnapshot(manifest)).toEqual(
      expect.objectContaining({
        questionnaires: expect.objectContaining({
          strip: expect.objectContaining({
            questionIds: ["q_nitrite", "q_leukocytes"],
          }),
        }),
      }),
    );
  });
});

describe("@beslismodel/testing clinical safety fixtures", () => {
  const fixtures = [
    {
      id: "nitrite-positive-redirect",
      questionnaireId: "strip",
      answers: { q_nitrite: { value: "positive", text: "Positief" } },
      expectedOutcome: { type: "redirect", target: "bacteriurie" },
      requiredAnsweredQuestionIds: ["q_nitrite"],
      forbiddenAnsweredQuestionIds: ["q_forbidden"],
      tags: ["urinestrip", "redirect"],
    },
    {
      id: "all-negative-result",
      questionnaireId: "strip",
      answers: { q_nitrite: { value: "negative", text: "Negatief" } },
      expectedOutcome: { type: "result", key: "normal" },
      requiredAnsweredQuestionIds: ["q_nitrite"],
      tags: ["urinestrip", "result"],
    },
  ] satisfies readonly ClinicalSafetyFixture[];

  it("evaluates passing clinical safety fixtures", () => {
    const results = evaluateClinicalSafetyFixtures(fixtures, (fixture) =>
      fixture.id === "nitrite-positive-redirect" ? "redirect:bacteriurie" : "result:normal",
    );

    expect(results).toHaveLength(2);
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results[0].outcome).toEqual({
      raw: "redirect:bacteriurie",
      target: "bacteriurie",
      type: "redirect",
    });
  });

  it("throws readable failures for unsafe outcomes and missing required answers", () => {
    expect(() => assertClinicalSafetyFixtures([fixtures[0]], () => "result:normal"))
      .toThrowErrorMatchingInlineSnapshot(`
      [Error: Clinical safety fixture check failed:
      - nitrite-positive-redirect: Unexpected clinical safety outcome.]
    `);

    expect(() =>
      assertClinicalSafetyFixtures(
        [
          {
            ...fixtures[0],
            answers: {},
          },
        ],
        () => "redirect:bacteriurie",
      ),
    ).toThrow("Required answered question missing: q_nitrite.");
  });
});
