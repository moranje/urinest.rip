import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPinia, setActivePinia } from "pinia";
import {
  createBeslismodelDataReadyGuard,
  createBeslismodelStore,
  noopTelemetryAdapter,
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

for (const term of forbiddenBoundaryTerms) {
  if (source.includes(term)) {
    throw new Error(`@beslismodel/vue boundary leak: ${term}`);
  }
}

setActivePinia(createPinia());

const useStore = createBeslismodelStore({
  loadManifest: async () => ({
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

noopTelemetryAdapter.track({
  type: "manifest.loaded",
  storeId: "smoke",
  questionnaireCount: 1,
});

console.log("@beslismodel/vue package exports ok");
