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

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const packages = [
  { dir: "packages/core", name: "@beslismodel/core" },
  { dir: "packages/compiler", name: "@beslismodel/compiler" },
  { dir: "packages/vue", name: "@beslismodel/vue" },
  { dir: "packages/testing", name: "@beslismodel/testing" },
];

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
id: packed-consumer-smoke
version: "1"
title: Packed consumer smoke
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
import { createCalculatorRegistry, getQuestionProgress } from "@beslismodel/core";
import { compileFlowFiles } from "@beslismodel/compiler";
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
  mkdirSync(join(consumerDir, "flows"), { recursive: true });
  writeFileSync(join(consumerDir, "flows", "fixture.yaml"), flowYaml);
  writeFileSync(join(consumerDir, "smoke.mjs"), smokeSource);

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

  console.log("Packed package consumer smoke passed with public @beslismodel/* imports");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
