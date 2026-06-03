import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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
