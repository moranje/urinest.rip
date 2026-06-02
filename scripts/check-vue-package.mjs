import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPinia, setActivePinia } from "pinia";
import {
  createBeslismodelDataReadyGuard,
  createBeslismodelLandingMenuSections,
  createBeslismodelStore,
  LandingMenuGrid,
  noopTelemetryAdapter,
  QuestionnaireRunner,
  ResultRenderer,
  useQuestionnaireRunner,
  useResultResolver,
} from "../packages/vue/dist/index.js";

const sourceDir = fileURLToPath(new URL("../packages/vue/src", import.meta.url));
const forbiddenBoundaryTerms = [
  "supabase",
  "log-sink",
  "errors",
  "breadcrumbs",
  "flow-trail",
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "fetch",
];

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const source = walk(sourceDir)
  .filter((path) => path.endsWith(".ts") && !path.endsWith(".test.ts"))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const boundaryPattern = (term) =>
  new RegExp(`(^|[^A-Za-z0-9_])${escapeRegExp(term)}([^A-Za-z0-9_]|$)`);

for (const term of forbiddenBoundaryTerms) {
  if (boundaryPattern(term).test(source)) {
    throw new Error(`@beslismodel/vue boundary leak: ${term}`);
  }
}

setActivePinia(createPinia());

let loadCount = 0;
const useStore = createBeslismodelStore({
  loadManifest: async () => ({
    metadata: { loadCount: ++loadCount },
    questionnaires: [
      {
        id: "package-smoke",
        version: "1",
        title: "Package smoke",
        category: "test",
        audience: ["tester"],
        domain: "test",
        recommendedStart: true,
        questions: [{ id: "q1", text: "Question", type: "select", options: [] }],
      },
    ],
  }),
  telemetry: noopTelemetryAdapter,
});

const store = useStore();
const manifest = await store.load();
if (manifest.questionnaires["package-smoke"]?.id !== "package-smoke") {
  throw new Error("vue package store factory export failed");
}
await store.load();
if (loadCount !== 1) {
  throw new Error("vue package manifest memory cache export failed");
}
await store.loadInitialData({ force: true });
if (loadCount !== 2) {
  throw new Error("vue package manifest force reload export failed");
}

const resolver = useResultResolver({
  determineOutcomeForPath: () => ({ outcome: "result:ok", ruleId: "rule-1" }),
  getAllAnswersForQuestionnaire: () => ({ q1: { value: "yes", text: "Yes" } }),
  getFullQuestionnaire: () => ({ resultsLogic: [{ id: "rule-1" }] }),
});

if (resolver.resolveResult("package-smoke").type !== "result") {
  throw new Error("vue package result resolver export failed");
}

const guard = createBeslismodelDataReadyGuard({
  useStore: () => ({
    dataReady: true,
    isLoading: false,
    loadingPromise: null,
    loadInitialData: async () => undefined,
  }),
});

if ((await guard({ name: "Questionnaire" }, { name: "Landing" })) !== true) {
  throw new Error("vue package route helper export failed");
}

const runner = useQuestionnaireRunner(
  {
    getAllAnswersForQuestionnaire: () => ({}),
    getAnswer: () => undefined,
    getEnhancedAnswers: () => ({}),
    getFullQuestionnaire: () => ({
      id: "package-smoke",
      version: "1",
      questionIds: ["q1"],
      stepIds: [],
      questions: [{ id: "q1", text: "Question", type: "select", options: [] }],
      steps: [],
    }),
    getQuestionById: () => ({ id: "q1", text: "Question", type: "select", options: [] }),
    getQuestionnaireById: () => ({
      id: "package-smoke",
      version: "1",
      questionIds: ["q1"],
      stepIds: [],
    }),
    getStepById: () => undefined,
    setAnswer: () => undefined,
  },
  { questionnaireId: "package-smoke" },
);

if (runner.start().type !== "question") {
  throw new Error("vue package questionnaire runner export failed");
}
if (QuestionnaireRunner.name !== "QuestionnaireRunner") {
  throw new Error("vue package questionnaire runner component export failed");
}

const landingSections = createBeslismodelLandingMenuSections(
  [
    {
      id: "package-smoke",
      title: "Package smoke",
      icon: "smoke",
      metadata: { landingOrder: 1, landingSection: "primary" },
    },
  ],
  { iconKeys: ["smoke"] },
);
if (
  landingSections.primary[0]?.id !== "package-smoke" ||
  LandingMenuGrid.name !== "LandingMenuGrid"
) {
  throw new Error("vue package landing menu export failed");
}
if (ResultRenderer.name !== "ResultRenderer") {
  throw new Error("vue package result renderer export failed");
}

noopTelemetryAdapter.track({
  type: "manifest.loaded",
  storeId: "smoke",
  questionnaireCount: 1,
});

console.log("@beslismodel/vue package exports ok");
