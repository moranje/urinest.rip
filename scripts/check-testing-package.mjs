import {
  assertClinicalSafetyFixtures,
  createManifestSnapshot,
  createStableSnapshot,
} from "../packages/testing/dist/index.js";

const snapshot = createManifestSnapshot({
  questionnaires: [
    {
      id: "package-smoke",
      version: "1",
      title: "Package smoke",
      questions: [{ id: "q1", text: "Question", type: "select", options: [] }],
      results: {
        ok: {
          title: "OK",
        },
      },
      resultsLogic: [
        {
          id: "rule-ok",
          actionType: "result",
          conditions: [],
          resultKey: "ok",
        },
      ],
    },
  ],
});

if (snapshot.questionnaireIds[0] !== "package-smoke") {
  throw new Error("testing package manifest snapshot export failed");
}

const stable = createStableSnapshot({ z: 1, a: 2 });
if (JSON.stringify(stable) !== JSON.stringify({ a: 2, z: 1 })) {
  throw new Error("testing package stable snapshot export failed");
}

const results = assertClinicalSafetyFixtures(
  [
    {
      id: "package-smoke-result",
      questionnaireId: "package-smoke",
      answers: { q1: { value: "yes", text: "Yes" } },
      expectedOutcome: { type: "result", key: "ok" },
      requiredAnsweredQuestionIds: ["q1"],
    },
  ],
  () => "result:ok",
);

if (!results[0]?.passed) {
  throw new Error("testing package clinical safety fixture export failed");
}

console.log("@beslismodel/testing package exports ok");
