import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  expectedPackageRegistry,
  getFrameworkPackageNames,
  getFrameworkPackages,
} from "./package-extraction-map.mjs";
import { assertRegistrySmokeVersion } from "./package-registry-smoke-version.mjs";
import { writeBasicFlowFixture, writeUrinestripFixtureFlows } from "./package-smoke-fixtures.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rootPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const defaultRegistry = expectedPackageRegistry;
const registry = process.env.BESLISMODEL_REGISTRY_URL ?? defaultRegistry;
const isConfigCheck = process.argv.includes("--check-config");
const isVersionCheck = process.argv.includes("--check-version");
const usesCurrentVersion = process.argv.includes("--current-version");

const packages = getFrameworkPackageNames(root);
const packageManifests = getFrameworkPackages(root).map((item) =>
  JSON.parse(readFileSync(join(root, item.packageJson), "utf8")),
);
const expectedVersions = new Set(packageManifests.map((manifest) => manifest.version));
const [expectedVersion] = expectedVersions;
const version =
  process.env.BESLISMODEL_REGISTRY_SMOKE_VERSION ?? (usesCurrentVersion ? expectedVersion : "");

const secretPattern = /(?:^|\n)\s*(?:(?:\/\/.*:)?_authToken|_password|password|username)\s*=/i;

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

if (questionnaire?.id !== "registry-smoke") {
  throw new Error("registry compiler CLI did not compile the smoke fixture");
}

if (compiledByApi.questionnaires[0]?.id !== "registry-smoke") {
  throw new Error("registry compiler API did not compile the smoke fixture");
}

const snapshot = createManifestSnapshot(compiledByCli);
if (!snapshot.questionnaireIds.includes("registry-smoke")) {
  throw new Error("registry testing package did not snapshot the compiled manifest");
}

const sections = createBeslismodelLandingMenuSections(compiledByCli.questionnaires);
if (sections.primary[0]?.id !== "registry-smoke") {
  throw new Error("registry vue package did not derive landing sections");
}

const progress = getQuestionProgress({
  questionnaire,
  currentQuestionId: questionnaire.questions[0]?.id ?? null,
  questionHistory: [],
});
if (progress.text !== "Vraag 1/1") {
  throw new Error("registry core progress export failed");
}

const registry = createCalculatorRegistry([
  {
    id: "score.sum",
    calculate: ({ values }) => ({ total: values.reduce((sum, value) => sum + value, 0) }),
  },
]);
const sum = await registry.run("score.sum", { values: [1, 2, 3] });
if (sum.total !== 6) {
  throw new Error("registry core calculator registry failed");
}

const cvrmRegistry = createCvrmPreventCalculatorRegistry();
const cvrmResult = await cvrmRegistry.run("cvrm.score2", {
  age: 65,
  sex: "M",
  smoking: true,
  systolicBp: 150,
  totalCholesterol: 6,
  hdlCholesterol: 1,
  region: "low",
});
if (cvrmResult.model !== "SCORE2" || cvrmResult.riskClass.label !== "hoog") {
  throw new Error("registry cvrm-prevent SCORE2 calculator failed");
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
  throw new Error("registry calculator-bound outcome failed");
}

const dmCareRegistry = createDmCareCalculatorRegistry();
const hba1cResult = await dmCareRegistry.run("dm.hba1c_conversion", {
  unit: "ifcc_mmol_mol",
  value: 53,
});
if (hba1cResult.ngspPercent !== 7 || hba1cResult.eAgMmolL !== 8.6) {
  throw new Error("registry dm-care HbA1c conversion failed");
}

const copdCareRegistry = createCopdCareCalculatorRegistry();
const goldAbeResult = await copdCareRegistry.run("copd.gold_abe", {
  moderateExacerbationsPastYear: 1,
  severeExacerbationsPastYear: 0,
  catScore: 4,
});
if (goldAbeResult.group !== "E" || goldAbeResult.exacerbationRisk !== "elevated") {
  throw new Error("registry copd-care GOLD ABE classification failed");
}

const urinestripManifest = await compileFlowFiles(new URL("./urinestrip-flows", import.meta.url).pathname);
const manifestIds = new Set(urinestripManifest.questionnaires.map((item) => item.id));
for (const id of ["strip", "bacteriurie", "leukocyturie", "hematurie"]) {
  if (!manifestIds.has(id)) {
    throw new Error(\`registry Urinestrip smoke missed questionnaire: \${id}\`);
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

const createStore = (manifest) => {
  setActivePinia(createPinia());
  const useStore = createBeslismodelStore({
    answersStorage: createMemoryStorage(),
    answersStorageKey: "registry-smoke-answers",
    answersTtlMs: 60_000,
    contextAliases: { role: "_role" },
    contextProvider: () => ({ role: "behandelaar" }),
    duplicateIdPolicy: "overwrite",
    loadManifest: async () => manifest,
    outcomeResolver: (answers, logic) => determineOutcome(answers, logic),
  });
  return useStore();
};

const store = createStore(urinestripManifest);
await store.loadInitialData();
const runner = useQuestionnaireRunner(store, { questionnaireId: "strip" });
if (runner.start().questionId !== "q_strip_nitrite") {
  throw new Error("registry Urinestrip runner did not start at nitrite");
}

const resolveStrip = async (answers) => {
  const currentStore = createStore(urinestripManifest);
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
  throw new Error("registry Urinestrip nitrite-positive redirect failed");
}

const leukocytesPositive = await resolveStrip({
  q_strip_nitrite: answer("negative"),
  q_strip_leuko: answer("positive_1"),
});
if (leukocytesPositive.targetQuestionnaireId !== "leukocyturie") {
  throw new Error("registry Urinestrip leukocyturia redirect failed");
}

const erythrocytesPositive = await resolveStrip({
  q_strip_nitrite: answer("negative"),
  q_strip_leuko: answer("negative"),
  q_strip_ery: answer("positive_1"),
});
if (erythrocytesPositive.targetQuestionnaireId !== "hematurie") {
  throw new Error("registry Urinestrip hematuria redirect failed");
}

const allNegative = await resolveStrip({
  q_strip_nitrite: answer("negative"),
  q_strip_leuko: answer("negative"),
  q_strip_ery: answer("negative"),
});
if (allNegative.resultKey !== "other.noConclusiveAbnormality") {
  throw new Error("registry Urinestrip negative result failed");
}
`;

const fail = (message) => {
  throw new Error(message);
};

const assertConfig = () => {
  const npmrcExample = readFileSync(join(root, ".npmrc.example"), "utf8");
  if (!npmrcExample.includes(`@beslismodel:registry=${defaultRegistry}`)) {
    fail(".npmrc.example must define the @beslismodel Gitea registry");
  }
  if (secretPattern.test(npmrcExample)) {
    fail(".npmrc.example must not contain auth material");
  }

  const projectNpmrc = join(root, ".npmrc");
  if (existsSync(projectNpmrc) && secretPattern.test(readFileSync(projectNpmrc, "utf8"))) {
    fail("Project .npmrc contains auth material; keep tokens in user-level ~/.npmrc");
  }

  console.log(
    "Package registry smoke config ready; set BESLISMODEL_REGISTRY_SMOKE_VERSION or run check:package-registry-smoke:current to install-smoke published packages",
  );
};

const dependencyVersion = (name) => {
  const declared = rootPackage.dependencies?.[name] ?? rootPackage.devDependencies?.[name];
  if (!declared) fail(`Missing root dependency range for registry smoke dependency: ${name}`);
  return declared;
};

const assertVersion = () => {
  assertRegistrySmokeVersion({ version, expectedVersion, expectedVersions });
};

if (isConfigCheck) {
  assertConfig();
  process.exit(0);
}

assertConfig();
assertVersion();

if (isVersionCheck) {
  console.log(`Package registry smoke version accepted: ${version}`);
  process.exit(0);
}

const tempDir = mkdtempSync(join(tmpdir(), "beslismodel-registry-consumer-"));

try {
  const cacheDir = join(tempDir, "npm-cache");
  const consumerDir = join(tempDir, "consumer");
  const flowsDir = join(consumerDir, "flows");
  const publicDir = join(consumerDir, "public");
  const urinestripFlowsDir = join(consumerDir, "urinestrip-flows");

  mkdirSync(flowsDir, { recursive: true });
  mkdirSync(publicDir, { recursive: true });
  writeBasicFlowFixture(flowsDir, "registry-smoke", "Registry smoke");
  writeUrinestripFixtureFlows(urinestripFlowsDir);

  const dependencies = Object.fromEntries([
    ...packages.map((name) => [name, version]),
    ["pinia", dependencyVersion("pinia")],
    ["vue", dependencyVersion("vue")],
    ["vue-router", dependencyVersion("vue-router")],
  ]);

  writeFileSync(
    join(consumerDir, "package.json"),
    JSON.stringify(
      {
        name: "beslismodel-registry-consumer-smoke",
        private: true,
        type: "module",
        dependencies,
      },
      null,
      2,
    ),
  );
  writeFileSync(join(consumerDir, ".npmrc"), `@beslismodel:registry=${registry}\n`);
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
      "--fetch-retries=1",
    ],
    { cwd: consumerDir, stdio: "inherit" },
  );

  execFileSync("npm", ["ls", ...packages, "--all"], {
    cwd: consumerDir,
    stdio: "inherit",
  });

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
    "Registry package consumer smoke passed with Gitea-installed @beslismodel/*, CVRM, DM and COPD calculators",
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
