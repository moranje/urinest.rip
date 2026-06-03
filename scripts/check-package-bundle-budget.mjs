import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const KB = 1024;

const packageBudgets = [
  { name: "@beslismodel/core", dir: "packages/core/dist", jsTotal: 40 * KB, largestJs: 40 * KB },
  {
    name: "@beslismodel/compiler",
    dir: "packages/compiler/dist",
    jsTotal: 40 * KB,
    largestJs: 32 * KB,
  },
  {
    name: "@beslismodel/cvrm-prevent",
    dir: "packages/cvrm-prevent/dist",
    jsTotal: 40 * KB,
    largestJs: 40 * KB,
  },
  { name: "@beslismodel/vue", dir: "packages/vue/dist", jsTotal: 80 * KB, largestJs: 80 * KB },
  {
    name: "@beslismodel/testing",
    dir: "packages/testing/dist",
    jsTotal: 24 * KB,
    largestJs: 24 * KB,
  },
];

const aggregateBudget = {
  jsTotal: 200 * KB,
};

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

let aggregateJsTotal = 0;
const reports = [];

for (const packageBudget of packageBudgets) {
  if (!existsSync(packageBudget.dir)) {
    throw new Error(`Package dist missing for ${packageBudget.name}: run npm run build:packages`);
  }

  const jsFiles = collectFiles(packageBudget.dir).filter(
    (file) => file.endsWith(".js") && !file.endsWith(".map"),
  );
  const jsTotal = sum(jsFiles);
  const largestJs = Math.max(0, ...jsFiles.map((file) => statSync(file).size));

  assertBudget(`${packageBudget.name} total JS`, jsTotal, packageBudget.jsTotal);
  assertBudget(`${packageBudget.name} largest JS`, largestJs, packageBudget.largestJs);
  aggregateJsTotal += jsTotal;
  reports.push(`${packageBudget.name} JS ${format(jsTotal)} largest ${format(largestJs)}`);
}

assertBudget("Package aggregate JS", aggregateJsTotal, aggregateBudget.jsTotal);

console.log(
  [`Package bundle budget OK`, ...reports, `aggregate ${format(aggregateJsTotal)}`].join(" | "),
);
