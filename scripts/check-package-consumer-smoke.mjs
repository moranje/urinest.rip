import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getFrameworkPackages } from "./package-extraction-map.mjs";
import { writeBasicFlowFixture, writeUrinestripFixtureFlows } from "./package-smoke-fixtures.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packages = getFrameworkPackages(root);

const externalDependencies = [
  "ajv",
  "ajv-formats",
  "glob",
  "js-yaml",
  "picocolors",
  "pinia",
  "vue",
  "vue-router",
];

const smokeSource = `
import {
  createCalculatorRegistry,
  determineOutcomeWithCalculators,
  getQuestionProgress,
} from "@beslismodel/core";
import { compileFlowFiles } from "@beslismodel/compiler";
import { createCopdCareCalculatorRegistry } from "@beslismodel/copd-care";
import { createCvrmPreventCalculatorRegistry } from "@beslismodel/cvrm-prevent";
import { createDmCareCalculatorRegistry } from "@beslismodel/dm-care";
import { createManifestSnapshot } from "@beslismodel/testing";
import { createBeslismodelLandingMenuSections, noopTelemetryAdapter } from "@beslismodel/vue";

const manifest = await compileFlowFiles(new URL("./flows", import.meta.url).pathname);
const questionnaire = manifest.questionnaires[0];

if (questionnaire?.id !== "packed-consumer-smoke") {
  throw new Error("compiler package did not compile the packed consumer fixture");
}

const snapshot = createManifestSnapshot(manifest);
if (!snapshot.questionnaireIds.includes("packed-consumer-smoke")) {
  throw new Error("testing package did not snapshot the compiled manifest");
}

const sections = createBeslismodelLandingMenuSections(manifest.questionnaires);
if (sections.primary[0]?.id !== "packed-consumer-smoke") {
  throw new Error("vue package did not derive landing sections from public exports");
}

const registry = createCalculatorRegistry([
  {
    id: "score.sum",
    calculate: ({ values }) => ({ total: values.reduce((sum, value) => sum + value, 0) }),
  },
]);
const score = await registry.run("score.sum", { values: [1, 2, 3] });
if (score.total !== 6) {
  throw new Error("core calculator registry failed from packed consumer");
}

const cvrmRegistry = createCvrmPreventCalculatorRegistry();
const cvrmResult = await cvrmRegistry.run("cvrm.score2", {
  age: 55,
  sex: "M",
  smoking: false,
  systolicBp: 140,
  totalCholesterol: 5.5,
  hdlCholesterol: 1.3,
  region: "low",
});
if (cvrmResult.model !== "SCORE2" || cvrmResult.riskClass.label !== "laag-matig") {
  throw new Error("cvrm-prevent package SCORE2 calculator failed from packed consumer");
}

const cvrmOutcome = await determineOutcomeWithCalculators({
  registry: cvrmRegistry,
  answers: {
    q_age: { value: "65", text: "65" },
    q_sex: { value: "M", text: "Man" },
    q_smoking: { value: "true", text: "Ja" },
    q_sbp: { value: "150", text: "150" },
    q_total_cholesterol: { value: "6", text: "6" },
    q_hdl: { value: "1", text: "1" },
  },
  calculatorBindings: [
    {
      id: "score2",
      calculatorId: "cvrm.score2",
      input: {
        age: { source: "answer", key: "q_age", coerce: "number" },
        sex: { source: "answer", key: "q_sex" },
        smoking: { source: "answer", key: "q_smoking", coerce: "boolean" },
        systolicBp: { source: "answer", key: "q_sbp", coerce: "number" },
        totalCholesterol: { source: "answer", key: "q_total_cholesterol", coerce: "number" },
        hdlCholesterol: { source: "answer", key: "q_hdl", coerce: "number" },
        region: { source: "literal", value: "low" },
      },
      outputs: {
        _score2_percent: { path: "riskPercent" },
        _score2_class: { path: "riskClass.label" },
      },
    },
  ],
  resultsLogic: [
    {
      id: "score2-high",
      actionType: "showResult",
      resultKey: "intensive_cvrm",
      conditions: [{ questionId: "_score2_class", operator: "equals", value: "hoog" }],
    },
  ],
});
if (cvrmOutcome.outcome !== "result:intensive_cvrm") {
  throw new Error("cvrm-prevent score-driven outcome failed from packed consumer");
}

const dmCareRegistry = createDmCareCalculatorRegistry();
const hba1cResult = await dmCareRegistry.run("dm.hba1c_conversion", {
  unit: "ifcc_mmol_mol",
  value: 53,
});
if (hba1cResult.ngspPercent !== 7 || hba1cResult.eAgMmolL !== 8.6) {
  throw new Error("dm-care HbA1c conversion failed from packed consumer");
}

const copdCareRegistry = createCopdCareCalculatorRegistry();
const goldAbeResult = await copdCareRegistry.run("copd.gold_abe", {
  moderateExacerbationsPastYear: 1,
  severeExacerbationsPastYear: 0,
  catScore: 4,
});
if (goldAbeResult.group !== "E" || goldAbeResult.exacerbationRisk !== "elevated") {
  throw new Error("copd-care GOLD ABE classification failed from packed consumer");
}

const progress = getQuestionProgress({
  questionnaire,
  currentQuestionId: questionnaire.questions[0]?.id ?? null,
  questionHistory: [],
});
if (progress.text !== "Vraag 1/1") {
  throw new Error("core progress export failed from packed consumer");
}

noopTelemetryAdapter.track({
  type: "manifest.loaded",
  storeId: "packed-consumer",
  questionnaireCount: manifest.questionnaires.length,
});
`;

const urinestripSmokeSource = `
import { createPinia, setActivePinia } from "pinia";
import { createCalculatorRegistry, determineOutcome } from "@beslismodel/core";
import { compileFlowFiles } from "@beslismodel/compiler";
import { calculateScore2Risk } from "@beslismodel/cvrm-prevent";
import {
  createBeslismodelDataReadyGuard,
  createBeslismodelStore,
  useQuestionnaireRunner,
  useResultResolver,
} from "@beslismodel/vue";

const manifest = await compileFlowFiles(new URL("./urinestrip-flows", import.meta.url).pathname);
const manifestIds = new Set(manifest.questionnaires.map((questionnaire) => questionnaire.id));
for (const id of ["strip", "bacteriurie", "leukocyturie", "hematurie"]) {
  if (!manifestIds.has(id)) {
    throw new Error(\`Urinestrip packed consumer manifest missed questionnaire: \${id}\`);
  }
}

const answer = (value, text = value) => ({ text, value });

const createMemoryStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
};

const createStore = () => {
  setActivePinia(createPinia());
  const useStore = createBeslismodelStore({
    answersStorage: createMemoryStorage(),
    answersStorageKey: "packed-urinestrip-consumer-answers",
    answersTtlMs: 60_000,
    contextAliases: { role: "_role" },
    contextProvider: () => ({ role: "behandelaar" }),
    duplicateIdPolicy: "overwrite",
    loadManifest: async () => manifest,
    outcomeResolver: (answers, logic) => determineOutcome(answers, logic),
  });
  return useStore();
};

const store = createStore();
const guard = createBeslismodelDataReadyGuard({ useStore: () => store });
const guardResult = await guard({ fullPath: "/questionnaire/strip" }, {});
if (guardResult !== true) {
  throw new Error("Urinestrip packed consumer data-ready guard failed");
}
if (store.getQuestionnaireById("strip")?.title !== "Urinestrip") {
  throw new Error("Urinestrip packed consumer store failed to load strip questionnaire");
}

const runner = useQuestionnaireRunner(store, { questionnaireId: "strip" });
const start = runner.start();
if (start.questionId !== "q_strip_nitrite" || runner.progress.value.text !== "Vraag 1/3") {
  throw new Error("Urinestrip packed consumer runner failed at first strip question");
}
store.setAnswer("strip", "q_strip_nitrite", answer("negative"));
const second = runner.advance();
if (second.questionId !== "q_strip_leuko") {
  throw new Error("Urinestrip packed consumer runner failed at leukocyte question");
}
store.setAnswer("strip", "q_strip_leuko", answer("negative"));
const third = runner.advance();
if (third.questionId !== "q_strip_ery" || runner.currentStep.value?.id !== "s_strip_3") {
  throw new Error("Urinestrip packed consumer runner failed at erythrocyte question");
}

const resolveStrip = async (answers) => {
  const currentStore = createStore();
  await currentStore.loadInitialData();
  for (const [questionId, value] of Object.entries(answers)) {
    currentStore.setAnswer("strip", questionId, value);
  }
  return useResultResolver(currentStore).resolveResult("strip");
};

const nitritePositive = await resolveStrip({
  q_strip_nitrite: answer("positive"),
});
if (nitritePositive.targetQuestionnaireId !== "bacteriurie") {
  throw new Error("Urinestrip packed consumer nitrite-positive redirect failed");
}

const leukocytesPositive = await resolveStrip({
  q_strip_nitrite: answer("negative"),
  q_strip_leuko: answer("positive_1"),
});
if (leukocytesPositive.targetQuestionnaireId !== "leukocyturie") {
  throw new Error("Urinestrip packed consumer leukocyturia redirect failed");
}

const erythrocytesPositive = await resolveStrip({
  q_strip_nitrite: answer("negative"),
  q_strip_leuko: answer("negative"),
  q_strip_ery: answer("positive_1"),
});
if (erythrocytesPositive.targetQuestionnaireId !== "hematurie") {
  throw new Error("Urinestrip packed consumer hematuria redirect failed");
}

const allNegative = await resolveStrip({
  q_strip_nitrite: answer("negative"),
  q_strip_leuko: answer("negative"),
  q_strip_ery: answer("negative"),
});
if (allNegative.resultKey !== "other.noConclusiveAbnormality") {
  throw new Error("Urinestrip packed consumer negative result failed");
}

const registry = createCalculatorRegistry([
  {
    id: "fixture.consumer-score",
    version: "fixture-1",
    label: "Consumer score",
    validateInput: (input) =>
      typeof input === "object" &&
      input !== null &&
      Array.isArray(input.values) &&
      input.values.every((value) => typeof value === "number"),
    calculate: (input, context) => ({
      score: input.values.reduce((sum, value) => sum + value, 0),
      role: context.role,
    }),
  },
]);
const score = await registry.run("fixture.consumer-score", { values: [1, 2, 3] }, {
  role: "triagist",
});
if (score.score !== 6 || score.role !== "triagist") {
  throw new Error("Urinestrip packed consumer calculator registration failed");
}

const cvrmRisk = calculateScore2Risk({
  age: 65,
  sex: "M",
  smoking: true,
  systolicBp: 150,
  totalCholesterol: 6,
  hdlCholesterol: 1,
  region: "low",
});
if (cvrmRisk.model !== "SCORE2" || cvrmRisk.riskClass.label !== "hoog") {
  throw new Error("Urinestrip packed consumer cvrm score package failed");
}
`;

const tempDir = mkdtempSync(join(tmpdir(), "beslismodel-packed-consumer-"));

try {
  const cacheDir = join(tempDir, "npm-cache");
  const packDir = join(tempDir, "packs");
  const extractDir = join(tempDir, "extract");
  const consumerDir = join(tempDir, "consumer");
  const nodeModulesDir = join(consumerDir, "node_modules");

  mkdirSync(packDir, { recursive: true });
  mkdirSync(extractDir, { recursive: true });
  mkdirSync(nodeModulesDir, { recursive: true });

  writeFileSync(
    join(consumerDir, "package.json"),
    JSON.stringify({ name: "beslismodel-packed-consumer-smoke", type: "module" }, null, 2),
  );
  writeBasicFlowFixture(
    join(consumerDir, "flows"),
    "packed-consumer-smoke",
    "Packed consumer smoke",
  );
  writeUrinestripFixtureFlows(join(consumerDir, "urinestrip-flows"));
  writeFileSync(join(consumerDir, "smoke.mjs"), smokeSource);
  writeFileSync(join(consumerDir, "urinestrip-smoke.mjs"), urinestripSmokeSource);

  for (const dependency of externalDependencies) {
    const source = join(root, "node_modules", dependency);
    if (!existsSync(source)) {
      throw new Error(`Missing external dependency for packed consumer smoke: ${dependency}`);
    }
    symlinkSync(source, join(nodeModulesDir, dependency), "dir");
  }

  for (const { dir, name } of packages) {
    const output = execFileSync(
      "npm",
      [
        "--cache",
        cacheDir,
        "pack",
        "--json",
        resolve(root, dir),
        "--pack-destination",
        packDir,
        "--ignore-scripts",
      ],
      { encoding: "utf8" },
    );
    const packResult = JSON.parse(output)[0];
    if (packResult.name !== name) {
      throw new Error(`${dir}: expected packed package ${name}, received ${packResult.name}`);
    }

    const packageExtractDir = join(extractDir, name.replace("/", "-"));
    mkdirSync(packageExtractDir, { recursive: true });
    execFileSync("tar", ["-xzf", join(packDir, packResult.filename), "-C", packageExtractDir]);

    const targetDir = join(nodeModulesDir, ...name.split("/"));
    mkdirSync(dirname(targetDir), { recursive: true });
    cpSync(join(packageExtractDir, "package"), targetDir, { recursive: true });
  }

  execFileSync(process.execPath, [join(consumerDir, "smoke.mjs")], {
    cwd: consumerDir,
    stdio: "inherit",
  });
  execFileSync(process.execPath, [join(consumerDir, "urinestrip-smoke.mjs")], {
    cwd: consumerDir,
    stdio: "inherit",
  });

  console.log(
    "Packed package consumer smoke passed with public @beslismodel/* imports, CVRM, DM and COPD calculators, and Urinestrip flows",
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
