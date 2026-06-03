import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const expectedRegistry = "https://git.oranje.wtf/api/packages/martien/npm/";
const packageFiles = [
  "packages/core/package.json",
  "packages/compiler/package.json",
  "packages/cvrm-prevent/package.json",
  "packages/vue/package.json",
  "packages/testing/package.json",
];
const secretPattern = /(?:^|\n)\s*(?:(?:\/\/.*:)?_authToken|_password|password|username)\s*=/i;

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const violations = [];

for (const file of packageFiles) {
  const manifest = readJson(file);
  if (manifest.publishConfig?.registry !== expectedRegistry) {
    violations.push(`${file}: publishConfig.registry must be ${expectedRegistry}`);
  }
}

const npmrcExample = readFileSync(".npmrc.example", "utf8");
if (!npmrcExample.includes(`@beslismodel:registry=${expectedRegistry}`)) {
  violations.push(".npmrc.example must define the @beslismodel Gitea registry");
}
if (secretPattern.test(npmrcExample)) {
  violations.push(".npmrc.example must not contain auth material");
}

const trackedNpmrc = execFileSync("git", ["ls-files", ".npmrc"], { encoding: "utf8" }).trim();
if (trackedNpmrc) {
  violations.push(".npmrc must stay untracked; keep tokens in user-level ~/.npmrc");
}

const projectNpmrcPath = join(process.cwd(), ".npmrc");
if (existsSync(projectNpmrcPath)) {
  const projectNpmrc = readFileSync(projectNpmrcPath, "utf8");
  if (secretPattern.test(projectNpmrc)) {
    const message = "Project .npmrc contains auth material; move the token to user-level ~/.npmrc.";
    if (process.env.CI === "true" || process.env.BESLISMODEL_STRICT_NPMRC === "true") {
      violations.push(message);
    } else {
      console.warn(`Warning: ${message}`);
    }
  }
}

if (violations.length > 0) {
  throw new Error(
    `Package release configuration is not registry-ready:\n${violations
      .map((violation) => `- ${violation}`)
      .join("\n")}`,
  );
}

console.log("Package release configuration is registry-ready");
