import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expectedPackageRegistry, getFrameworkPackages } from "./package-extraction-map.mjs";

const packageFiles = getFrameworkPackages().map((item) => item.packageJson);
const secretPattern = /(?:^|\n)\s*(?:(?:\/\/.*:)?_authToken|_password|password|username)\s*=/i;

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const violations = [];

for (const file of packageFiles) {
  const manifest = readJson(file);
  if (manifest.publishConfig?.registry !== expectedPackageRegistry) {
    violations.push(`${file}: publishConfig.registry must be ${expectedPackageRegistry}`);
  }
}

const npmrcExample = readFileSync(".npmrc.example", "utf8");
if (!npmrcExample.includes(`@beslismodel:registry=${expectedPackageRegistry}`)) {
  violations.push(".npmrc.example must define the @beslismodel Gitea registry");
}
if (secretPattern.test(npmrcExample)) {
  violations.push(".npmrc.example must not contain auth material");
}

let trackedNpmrc = "";
try {
  trackedNpmrc = execFileSync("git", ["ls-files", ".npmrc"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  trackedNpmrc = "";
}
if (trackedNpmrc) {
  violations.push(".npmrc must stay untracked; keep tokens in user-level ~/.npmrc");
}

const projectNpmrcPath = join(process.cwd(), ".npmrc");
if (existsSync(projectNpmrcPath)) {
  const projectNpmrc = readFileSync(projectNpmrcPath, "utf8");
  if (secretPattern.test(projectNpmrc)) {
    violations.push(
      "Project .npmrc contains auth material; move the token to user-level ~/.npmrc.",
    );
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
