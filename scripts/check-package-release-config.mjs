import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expectedPackageRegistry, getFrameworkPackages } from "./package-extraction-map.mjs";

const packages = getFrameworkPackages();
const secretPattern = /(?:^|\n)\s*(?:(?:\/\/.*:)?_authToken|_password|password|username)\s*=/i;
const strictNpmrc = process.env.BESLISMODEL_STRICT_NPMRC === "true";
const forbiddenTrackedFile = (file) =>
  file === ".npmrc" ||
  file.endsWith("/.npmrc") ||
  file === ".env" ||
  (file.startsWith(".env.") && file !== ".env.example") ||
  (file.includes("/.env.") && !file.endsWith("/.env.example"));

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const violations = [];

const prereleaseVersionPattern = /^\d+\.\d+\.\d+-[0-9A-Za-z.-]+$/;

for (const { dir, name, packageJson } of packages) {
  const manifest = readJson(packageJson);
  if (manifest.name !== name) {
    violations.push(`${packageJson}: package name must be ${name}`);
  }
  if (manifest.private !== false) {
    violations.push(`${packageJson}: private must be false`);
  }
  if (!prereleaseVersionPattern.test(manifest.version)) {
    violations.push(`${packageJson}: version must be a prerelease for dist-tag next`);
  }
  if (!manifest.description) {
    violations.push(`${packageJson}: description is required`);
  }
  if (manifest.license !== "GPL-3.0-only") {
    violations.push(`${packageJson}: license must be GPL-3.0-only`);
  }
  if (!Array.isArray(manifest.keywords) || manifest.keywords.length === 0) {
    violations.push(`${packageJson}: keywords must be non-empty`);
  }
  if (!manifest.homepage?.startsWith("https://")) {
    violations.push(`${packageJson}: homepage must be https URL`);
  }
  if (!manifest.bugs?.url?.startsWith("https://")) {
    violations.push(`${packageJson}: bugs.url must be https URL`);
  }
  if (
    manifest.repository?.type !== "git" ||
    !manifest.repository?.url?.startsWith("git+https://")
  ) {
    violations.push(`${packageJson}: repository must be a git+https URL`);
  }
  if (manifest.repository?.directory !== dir) {
    violations.push(`${packageJson}: repository.directory must be ${dir}`);
  }
  if (
    !Array.isArray(manifest.files) ||
    manifest.files.length !== 1 ||
    manifest.files[0] !== "dist"
  ) {
    violations.push(`${packageJson}: files must contain only dist`);
  }
  if (manifest.type !== "module") {
    violations.push(`${packageJson}: type must be module`);
  }
  if (manifest.sideEffects !== false) {
    violations.push(`${packageJson}: sideEffects must be false`);
  }
  if (manifest.engines?.node !== ">=20.19.0") {
    violations.push(`${packageJson}: engines.node must be >=20.19.0`);
  }
  if (!manifest.scripts?.prepack?.includes(`run build:${dir.replace("packages/", "")}`)) {
    violations.push(`${packageJson}: prepack must build its package`);
  }
  if (!manifest.exports?.["."]?.types || !manifest.exports?.["."]?.import) {
    violations.push(`${packageJson}: exports[.] must expose import and types`);
  }
  if (manifest.publishConfig?.registry !== expectedPackageRegistry) {
    violations.push(`${packageJson}: publishConfig.registry must be ${expectedPackageRegistry}`);
  }
}

const npmrcExample = readFileSync(".npmrc.example", "utf8");
if (!npmrcExample.includes(`@beslismodel:registry=${expectedPackageRegistry}`)) {
  violations.push(".npmrc.example must define the @beslismodel Gitea registry");
}
if (secretPattern.test(npmrcExample)) {
  violations.push(".npmrc.example must not contain auth material");
}

let trackedForbiddenFiles = [];
try {
  trackedForbiddenFiles = execFileSync("git", ["ls-files"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  })
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean)
    .filter(forbiddenTrackedFile);
} catch {
  trackedForbiddenFiles = [];
}
if (trackedForbiddenFiles.length > 0) {
  violations.push(
    `.npmrc and non-example .env files must stay untracked; keep tokens in user-level ~/.npmrc or CI secrets:\n${trackedForbiddenFiles.join("\n")}`,
  );
}

const projectNpmrcPath = join(process.cwd(), ".npmrc");
if (existsSync(projectNpmrcPath)) {
  const projectNpmrc = readFileSync(projectNpmrcPath, "utf8");
  if (strictNpmrc && secretPattern.test(projectNpmrc)) {
    violations.push(
      "Project .npmrc must not contain auth material when BESLISMODEL_STRICT_NPMRC=true; use CI secret injection.",
    );
  }
  if (secretPattern.test(projectNpmrc)) {
    violations.push(
      "Project .npmrc contains auth material; move the token to user-level ~/.npmrc.",
    );
  }
  if (
    projectNpmrc.includes("@beslismodel:registry=") &&
    !projectNpmrc.includes(`@beslismodel:registry=${expectedPackageRegistry}`)
  ) {
    violations.push(`Project .npmrc must define @beslismodel:registry=${expectedPackageRegistry}`);
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
