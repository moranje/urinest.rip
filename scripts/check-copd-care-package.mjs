import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const distSource = readFileSync(
  fileURLToPath(new URL("../packages/copd-care/dist/index.js", import.meta.url)),
  "utf8",
);
if (!distSource.includes("@beslismodel/core")) {
  throw new Error("@beslismodel/copd-care must keep @beslismodel/core external in dist");
}

const coreDistUrl = new URL("../packages/core/dist/index.js", import.meta.url).href;
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const smokeDir = mkdtempSync(join(repoRoot, ".beslismodel-copd-care-smoke-"));
const smokeFile = join(smokeDir, "index.mjs");
writeFileSync(
  smokeFile,
  distSource
    .replaceAll('"@beslismodel/core"', JSON.stringify(coreDistUrl))
    .replaceAll("'@beslismodel/core'", JSON.stringify(coreDistUrl)),
);

const {
  classifyGoldAbe,
  copdCareCalculatorIds,
  copdCareRegistryStatus,
  createCopdCareCalculatorRegistry,
  goldAbeTestVectors,
} = await import(pathToFileURL(smokeFile).href);
rmSync(smokeDir, { recursive: true, force: true });

if (!copdCareCalculatorIds.includes("copd.gold_abe")) {
  throw new Error("@beslismodel/copd-care did not export copd.gold_abe");
}

if (
  copdCareRegistryStatus.status !== "verified" ||
  copdCareRegistryStatus.exportsClinicalCalculators !== true
) {
  throw new Error("@beslismodel/copd-care registry status is not verified");
}

const registry = createCopdCareCalculatorRegistry();
const registryResult = await registry.run("copd.gold_abe", goldAbeTestVectors[3].input);
if (registryResult.group !== goldAbeTestVectors[3].expected.group) {
  throw new Error("@beslismodel/copd-care registry run failed");
}

for (const vector of goldAbeTestVectors) {
  const result = classifyGoldAbe(vector.input);
  for (const key of ["group", "symptomBurden", "exacerbationRisk"]) {
    if (result[key] !== vector.expected[key]) {
      throw new Error(`@beslismodel/copd-care GOLD ABE vector failed: ${vector.id}:${key}`);
    }
  }
}

console.log("@beslismodel/copd-care package exports ok");
