import { readFileSync } from "node:fs";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");

const violations = [];
const scripts = packageJson.scripts ?? {};
const devDependencies = packageJson.devDependencies ?? {};
const lockPackages = packageLock.packages ?? {};

const requireScript = (name, expected) => {
  const script = scripts[name] ?? "";
  if (!script.includes(expected)) {
    violations.push(`package.json scripts.${name} must include "${expected}"`);
  }
};

const requireDevDependency = (name, pattern) => {
  const version = devDependencies[name];
  if (!version || !pattern.test(version)) {
    violations.push(`package.json devDependencies.${name} must match ${pattern}`);
  }
};

requireDevDependency("oxfmt", /^\^?0\./);
requireDevDependency("oxlint", /^\^?1\./);
requireDevDependency("@typescript/native-preview", /^\^?7\./);
requireDevDependency("typescript", /^\^?6\./);
requireDevDependency("vite", /^\^?8\./);

requireScript("format", "oxfmt --write src/ packages/ fixtures/");
requireScript("format:check", "oxfmt --check src/ packages/ fixtures/");
requireScript("lint", "oxlint src/ packages/ fixtures/ --deny-warnings");
requireScript("lint:all", "oxlint src/ packages/ fixtures/ --deny-warnings");
requireScript("lint:all", "eslint src/ packages/ fixtures/");
requireScript("check:tsgo", "tsgo --noEmit --project tsconfig.tsgo.json");
requireScript("check:tsgo:app", "tsgo --noEmit --project tsconfig.app.tsgo.json");
requireScript("check:app", "check:modern-toolchain");
requireScript("check:app", "format:check");
requireScript("check:app", "lint:all");
requireScript("check:app", "check:tsgo:app");
requireScript("build", "vite build");

for (const scriptName of [
  "build:core",
  "build:compiler",
  "build:vue:only",
  "build:testing",
  "build:cvrm-prevent",
  "build:dm-care",
  "build:copd-care",
]) {
  requireScript(scriptName, "vite build --config packages/");
  requireScript(scriptName, "tsc -p packages/");
}

if (!lockPackages["node_modules/rolldown"]) {
  violations.push("package-lock.json must include node_modules/rolldown from Vite 8");
}

if (!lockPackages["node_modules/@rolldown/pluginutils"]) {
  violations.push("package-lock.json must include @rolldown/pluginutils from Vue/Vite tooling");
}

if (violations.length > 0) {
  throw new Error(
    `Modern toolchain contract failed:\n${violations
      .map((violation) => `- ${violation}`)
      .join("\n")}`,
  );
}

console.log("Modern toolchain contract passed: oxfmt, oxlint, tsgo, Vite 8 and Rolldown");
