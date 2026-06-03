import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getFrameworkPackages } from "./package-extraction-map.mjs";

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

const flowYaml = `
id: file-install-smoke
version: "1"
title: File install smoke
category: test
audience: [tester]
domain: test
recommendedStart: true
metadata:
  landingSection: primary
  landingOrder: 1
questions:
  answer:
    text: Answer
    type: select
    options:
      - text: Yes
        value: yes
steps:
  - title: Start
    questions: [answer]
results:
  ok:
    title: Ok
    sources:
      - name: Test source
        url: https://example.test/source
logic:
  - when: ["answer == yes"]
    show: ok
`;

const smokeSource = `
import { readFile } from "node:fs/promises";
import { createPinia, setActivePinia } from "pinia";
import {
  createCalculatorRegistry,
  determineOutcome,
  determineOutcomeWithCalculators,
  getQuestionProgress,
} from "@beslismodel/core";
import { compileFlowFiles } from "@beslismodel/compiler";
import { createCopdCareCalculatorRegistry } from "@beslismodel/copd-care";
import { createCvrmPreventCalculatorRegistry } from "@beslismodel/cvrm-prevent";
import { createDmCareCalculatorRegistry } from "@beslismodel/dm-care";
import { createManifestSnapshot } from "@beslismodel/testing";
import {
  createBeslismodelLandingMenuSections,
  createBeslismodelStore,
  useQuestionnaireRunner,
  useResultResolver,
} from "@beslismodel/vue";

const compiledByCli = JSON.parse(await readFile(new URL("./public/main.json", import.meta.url), "utf8"));
const compiledByApi = await compileFlowFiles(new URL("./flows", import.meta.url).pathname);
const questionnaire = compiledByCli.questionnaires[0];

if (questionnaire?.id !== "file-install-smoke") {
  throw new Error("installed compiler CLI did not compile the file-install fixture");
}

if (compiledByApi.questionnaires[0]?.id !== "file-install-smoke") {
  throw new Error("installed compiler API did not compile the file-install fixture");
}

const snapshot = createManifestSnapshot(compiledByCli);
if (!snapshot.questionnaireIds.includes("file-install-smoke")) {
  throw new Error("installed testing package did not snapshot the compiled manifest");
}

const sections = createBeslismodelLandingMenuSections(compiledByCli.questionnaires);
if (sections.primary[0]?.id !== "file-install-smoke") {
  throw new Error("installed vue package did not derive landing sections");
}

const progress = getQuestionProgress({
  questionnaire,
  currentQuestionId: questionnaire.questions[0]?.id ?? null,
  questionHistory: [],
});
if (progress.text !== "Vraag 1/1") {
  throw new Error("installed core progress export failed");
}

const registry = createCalculatorRegistry([
  {
    id: "score.sum",
    calculate: ({ values }) => ({ total: values.reduce((sum, value) => sum + value, 0) }),
  },
]);
const sum = await registry.run("score.sum", { values: [1, 2, 3] });
if (sum.total !== 6) {
  throw new Error("installed core calculator registry failed");
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
  throw new Error("installed cvrm-prevent SCORE2 calculator failed");
}

const outcome = await determineOutcomeWithCalculators({
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
if (outcome.outcome !== "result:intensive_cvrm") {
  throw new Error("installed calculator-bound outcome failed");
}

const dmCareRegistry = createDmCareCalculatorRegistry();
const hba1cResult = await dmCareRegistry.run("dm.hba1c_conversion", {
  unit: "ifcc_mmol_mol",
  value: 53,
});
if (hba1cResult.ngspPercent !== 7 || hba1cResult.eAgMmolL !== 8.6) {
  throw new Error("installed dm-care HbA1c conversion failed");
}

const copdCareRegistry = createCopdCareCalculatorRegistry();
const goldAbeResult = await copdCareRegistry.run("copd.gold_abe", {
  moderateExacerbationsPastYear: 1,
  severeExacerbationsPastYear: 0,
  catScore: 4,
});
if (goldAbeResult.group !== "E" || goldAbeResult.exacerbationRisk !== "elevated") {
  throw new Error("installed copd-care GOLD ABE classification failed");
}

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

setActivePinia(createPinia());
const useStore = createBeslismodelStore({
  answersStorage: createMemoryStorage(),
  answersStorageKey: "file-install-consumer-answers",
  answersTtlMs: 60_000,
  duplicateIdPolicy: "overwrite",
  loadManifest: async () => compiledByCli,
  outcomeResolver: (answers, logic) => determineOutcome(answers, logic),
});
const store = useStore();
await store.loadInitialData();

const runner = useQuestionnaireRunner(store, { questionnaireId: "file-install-smoke" });
const start = runner.start();
const firstQuestionId = questionnaire.questions[0]?.id;
if (start.questionId !== firstQuestionId) {
  throw new Error("installed vue questionnaire runner failed");
}
store.setAnswer("file-install-smoke", firstQuestionId, { text: "Yes", value: "yes" });
const result = useResultResolver(store).resolveResult("file-install-smoke");
if (result.resultKey !== "ok") {
  throw new Error("installed vue result resolver failed");
}
`;

const packageLockPath = (packageName) => `node_modules/${packageName}`;

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const fileDependencyForInstalledPackage = (name) => {
  const source = join(root, "node_modules", ...name.split("/"));
  if (!existsSync(source)) {
    throw new Error(`Missing installed dependency for file-install consumer smoke: ${name}`);
  }
  return `file:${source}`;
};

const tempDir = mkdtempSync(join(tmpdir(), "beslismodel-file-install-consumer-"));

try {
  const cacheDir = join(tempDir, "npm-cache");
  const packDir = join(tempDir, "packs");
  const consumerDir = join(tempDir, "consumer");
  const flowsDir = join(consumerDir, "flows");
  const publicDir = join(consumerDir, "public");

  mkdirSync(packDir, { recursive: true });
  mkdirSync(flowsDir, { recursive: true });
  mkdirSync(publicDir, { recursive: true });

  const dependencies = Object.fromEntries(
    externalDependencies.map((name) => [name, fileDependencyForInstalledPackage(name)]),
  );

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
    dependencies[name] = `file:${join(packDir, packResult.filename)}`;
  }

  writeFileSync(
    join(consumerDir, "package.json"),
    JSON.stringify(
      {
        name: "beslismodel-file-install-consumer-smoke",
        private: true,
        type: "module",
        dependencies,
      },
      null,
      2,
    ),
  );
  writeFileSync(join(flowsDir, "fixture.yaml"), flowYaml);
  writeFileSync(join(consumerDir, "smoke.mjs"), smokeSource);

  execFileSync(
    "npm",
    [
      "--cache",
      cacheDir,
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--prefer-offline",
      "--fetch-retries=0",
      "--fetch-timeout=10000",
    ],
    { cwd: consumerDir, stdio: "inherit" },
  );

  execFileSync("npm", ["ls", ...packages.map((item) => item.name), "--all"], {
    cwd: consumerDir,
    stdio: "inherit",
  });

  const packageLock = readJson(join(consumerDir, "package-lock.json"));
  for (const { name } of packages) {
    const installed = packageLock.packages?.[packageLockPath(name)];
    if (!installed?.resolved?.startsWith("file:")) {
      throw new Error(`${name} was not installed from a file tarball dependency`);
    }
  }

  const binaryName = process.platform === "win32" ? "beslismodel.cmd" : "beslismodel";
  execFileSync(
    join(consumerDir, "node_modules", ".bin", binaryName),
    ["build", "--flows", "flows", "--out", "public/main.json"],
    { cwd: consumerDir, stdio: "inherit" },
  );
  execFileSync(process.execPath, [join(consumerDir, "smoke.mjs")], {
    cwd: consumerDir,
    stdio: "inherit",
  });

  console.log(
    "File-tarball install consumer smoke passed with npm-installed @beslismodel/* packages, CVRM, DM and COPD calculators",
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
