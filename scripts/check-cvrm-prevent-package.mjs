import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const distSource = readFileSync(
  fileURLToPath(new URL("../packages/cvrm-prevent/dist/index.js", import.meta.url)),
  "utf8",
);
if (!distSource.includes("@beslismodel/core")) {
  throw new Error("@beslismodel/cvrm-prevent must keep @beslismodel/core external in dist");
}

const coreDistUrl = new URL("../packages/core/dist/index.js", import.meta.url).href;
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const smokeDir = mkdtempSync(join(repoRoot, ".beslismodel-cvrm-smoke-"));
const smokeFile = join(smokeDir, "index.mjs");
writeFileSync(
  smokeFile,
  distSource
    .replaceAll('"@beslismodel/core"', JSON.stringify(coreDistUrl))
    .replaceAll("'@beslismodel/core'", JSON.stringify(coreDistUrl)),
);

const {
  calculatePreventRisk,
  calculateScore2Risk,
  createCvrmPreventCalculatorRegistry,
  cvrmPreventCalculatorIds,
  cvrmPreventRegistryStatus,
  preventTestVectors,
  score2TestVectors,
} = await import(pathToFileURL(smokeFile).href);
rmSync(smokeDir, { recursive: true, force: true });

if (!cvrmPreventCalculatorIds.includes("cvrm.score2")) {
  throw new Error("@beslismodel/cvrm-prevent did not export cvrm.score2");
}

if (!cvrmPreventCalculatorIds.includes("cvrm.prevent")) {
  throw new Error("@beslismodel/cvrm-prevent did not export cvrm.prevent");
}

if (
  cvrmPreventRegistryStatus.status !== "verified" ||
  cvrmPreventRegistryStatus.exportsClinicalCalculators !== true
) {
  throw new Error("@beslismodel/cvrm-prevent registry status is not verified");
}

const registry = createCvrmPreventCalculatorRegistry();
const registryResult = await registry.run("cvrm.score2", score2TestVectors[0].input);
if (registryResult.model !== score2TestVectors[0].expected.model) {
  throw new Error("@beslismodel/cvrm-prevent registry run failed");
}
const preventRegistryResult = await registry.run("cvrm.prevent", preventTestVectors[0].input);
if (preventRegistryResult.modelType !== preventTestVectors[0].expected.modelType) {
  throw new Error("@beslismodel/cvrm-prevent PREVENT registry run failed");
}

for (const vector of score2TestVectors) {
  const result = calculateScore2Risk(vector.input);
  const tolerance = vector.tolerance ?? 0.3;
  if (
    result.model !== vector.expected.model ||
    result.riskPercent < vector.expected.riskPercent - tolerance ||
    result.riskPercent > vector.expected.riskPercent + tolerance
  ) {
    throw new Error(`@beslismodel/cvrm-prevent SCORE2 vector failed: ${vector.id}`);
  }
}

for (const vector of preventTestVectors) {
  const result = calculatePreventRisk(vector.input);
  const tolerance = vector.tolerance ?? 0.001;
  if (result.modelType !== vector.expected.modelType) {
    throw new Error(`@beslismodel/cvrm-prevent PREVENT model failed: ${vector.id}`);
  }
  for (const expectedRisk of vector.expected.risks) {
    const actualRisk = result.risks.find((risk) => risk.horizon === expectedRisk.horizon);
    if (!actualRisk) {
      throw new Error(`@beslismodel/cvrm-prevent PREVENT horizon missing: ${vector.id}`);
    }
    for (const outcome of ["totalCvd", "ascvd", "heartFailure", "chd", "stroke"]) {
      if (
        actualRisk[outcome] < expectedRisk[outcome] - tolerance ||
        actualRisk[outcome] > expectedRisk[outcome] + tolerance
      ) {
        throw new Error(`@beslismodel/cvrm-prevent PREVENT vector failed: ${vector.id}`);
      }
    }
  }
}

console.log("@beslismodel/cvrm-prevent package exports ok");
