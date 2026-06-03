import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const distSource = readFileSync(
  fileURLToPath(new URL("../packages/dm-care/dist/index.js", import.meta.url)),
  "utf8",
);
if (!distSource.includes("@beslismodel/core")) {
  throw new Error("@beslismodel/dm-care must keep @beslismodel/core external in dist");
}

const coreDistUrl = new URL("../packages/core/dist/index.js", import.meta.url).href;
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const smokeDir = mkdtempSync(join(repoRoot, ".beslismodel-dm-care-smoke-"));
const smokeFile = join(smokeDir, "index.mjs");
writeFileSync(
  smokeFile,
  distSource
    .replaceAll('"@beslismodel/core"', JSON.stringify(coreDistUrl))
    .replaceAll("'@beslismodel/core'", JSON.stringify(coreDistUrl)),
);

const {
  convertHba1c,
  createDmCareCalculatorRegistry,
  dmCareCalculatorIds,
  dmCareRegistryStatus,
  hba1cTestVectors,
} = await import(pathToFileURL(smokeFile).href);
rmSync(smokeDir, { recursive: true, force: true });

if (!dmCareCalculatorIds.includes("dm.hba1c_conversion")) {
  throw new Error("@beslismodel/dm-care did not export dm.hba1c_conversion");
}

if (
  dmCareRegistryStatus.status !== "verified" ||
  dmCareRegistryStatus.exportsClinicalCalculators !== true
) {
  throw new Error("@beslismodel/dm-care registry status is not verified");
}

const registry = createDmCareCalculatorRegistry();
const registryResult = await registry.run("dm.hba1c_conversion", hba1cTestVectors[2].input);
if (registryResult.ngspPercent !== hba1cTestVectors[2].expected.ngspPercent) {
  throw new Error("@beslismodel/dm-care registry run failed");
}

for (const vector of hba1cTestVectors) {
  const result = convertHba1c(vector.input);
  const tolerance = vector.tolerance ?? 0.2;
  for (const key of ["ifccMmolMol", "ngspPercent", "eAgMgDl", "eAgMmolL"]) {
    if (
      result[key] < vector.expected[key] - tolerance ||
      result[key] > vector.expected[key] + tolerance
    ) {
      throw new Error(`@beslismodel/dm-care HbA1c vector failed: ${vector.id}:${key}`);
    }
  }
}

console.log("@beslismodel/dm-care package exports ok");
