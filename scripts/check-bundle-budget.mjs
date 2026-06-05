import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const KB = 1024;
const appBundleBudgets = {
  jsTotal: 950 * KB,
  largestJs: 550 * KB,
  cssTotal: 160 * KB,
  compressedTotal: 450 * KB,
};

const DIST_DIR = "dist";
const ASSETS_DIR = join(DIST_DIR, "assets");

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

function sum(files) {
  return files.reduce((total, file) => total + statSync(file).size, 0);
}

function format(bytes) {
  return `${(bytes / KB).toFixed(1)} KiB`;
}

function assertBudget(label, actual, max) {
  if (actual <= max) return;
  throw new Error(`${label} budget exceeded: ${format(actual)} > ${format(max)}`);
}

const files = collectFiles(ASSETS_DIR);
const jsFiles = files.filter((file) => file.endsWith(".js"));
const cssFiles = files.filter((file) => file.endsWith(".css"));
const compressedFiles = files.filter((file) => file.endsWith(".gz") || file.endsWith(".br"));

const jsTotal = sum(jsFiles);
const largestJs = Math.max(0, ...jsFiles.map((file) => statSync(file).size));
const cssTotal = sum(cssFiles);
const compressedTotal = sum(compressedFiles);

assertBudget("Total JS", jsTotal, appBundleBudgets.jsTotal);
assertBudget("Largest JS chunk", largestJs, appBundleBudgets.largestJs);
assertBudget("Total CSS", cssTotal, appBundleBudgets.cssTotal);
assertBudget("Compressed assets", compressedTotal, appBundleBudgets.compressedTotal);

console.log(
  [
    `Bundle budget OK`,
    `JS ${format(jsTotal)}`,
    `largest JS ${format(largestJs)}`,
    `CSS ${format(cssTotal)}`,
    `compressed ${format(compressedTotal)}`,
  ].join(" | "),
);
