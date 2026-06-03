import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const KB = 1024;
export const expectedPackageRegistry = "https://git.oranje.wtf/api/packages/martien/npm/";

export const appBundleBudgets = {
  jsTotal: 950 * KB,
  largestJs: 550 * KB,
  cssTotal: 160 * KB,
  compressedTotal: 450 * KB,
};

export const packageBundleBudgets = {
  "@beslismodel/core": { jsTotal: 40 * KB, largestJs: 40 * KB },
  "@beslismodel/compiler": { jsTotal: 40 * KB, largestJs: 32 * KB },
  "@beslismodel/cvrm-prevent": { jsTotal: 40 * KB, largestJs: 40 * KB },
  "@beslismodel/dm-care": { jsTotal: 24 * KB, largestJs: 24 * KB },
  "@beslismodel/vue": { jsTotal: 80 * KB, largestJs: 80 * KB },
  "@beslismodel/testing": { jsTotal: 24 * KB, largestJs: 24 * KB },
};

export const packageAggregateBudget = {
  jsTotal: 224 * KB,
};

export function readPackageExtractionMap(root = repoRoot) {
  return JSON.parse(readFileSync(resolve(root, "docs/package-extraction-map.json"), "utf8"));
}

export function getFrameworkPackages(root = repoRoot) {
  return readPackageExtractionMap(root).packages.map((item) => ({
    dir: item.sourceRoot,
    name: item.name,
    packageJson: item.packageJson,
  }));
}

export function getFrameworkPackageNames(root = repoRoot) {
  return getFrameworkPackages(root).map((item) => item.name);
}
