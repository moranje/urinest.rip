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
  calculateScore2Risk,
  createCvrmPreventCalculatorRegistry,
  cvrmPreventCalculatorIds,
  cvrmPreventRegistryStatus,
  score2TestVectors,
} = await import(pathToFileURL(smokeFile).href);
rmSync(smokeDir, { recursive: true, force: true });

if (!cvrmPreventCalculatorIds.includes("cvrm.score2")) {
  throw new Error("@beslismodel/cvrm-prevent did not export cvrm.score2");
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

console.log("@beslismodel/cvrm-prevent package exports ok");
