import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const extractionMap = JSON.parse(readFileSync("docs/package-extraction-map.json", "utf8"));
const appOnlyPaths = extractionMap.appOnlyExclusions.map((path) => path.replace(/\/$/u, ""));

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) return path;
    if (stat.isDirectory()) return walk(path);
    return path;
  });

const tempDir = mkdtempSync(join(tmpdir(), "beslismodel-framework-extract-"));

try {
  execFileSync(
    process.execPath,
    ["scripts/extract-beslismodel-framework.mjs", "--target", tempDir],
    {
      stdio: "inherit",
    },
  );

  for (const appOnlyPath of appOnlyPaths) {
    if (existsSync(join(tempDir, appOnlyPath))) {
      throw new Error(`Extracted framework contains app-only path: ${appOnlyPath}`);
    }
  }

  const extractedFiles = walk(tempDir).map((path) => path.slice(tempDir.length + 1));
  for (const file of extractedFiles) {
    for (const appOnlyPath of appOnlyPaths) {
      if (file === appOnlyPath || file.startsWith(`${appOnlyPath}/`)) {
        throw new Error(`Extracted framework contains app-only file: ${file}`);
      }
    }
  }

  if (!existsSync(join(tempDir, "package-lock.json"))) {
    throw new Error("Extracted framework must include package-lock.json so npm ci works in CI");
  }

  const gitignore = readFileSync(join(tempDir, ".gitignore"), "utf8");
  for (const requiredGitignore of ["node_modules", "packages/**/dist", ".env", "*.tgz"]) {
    if (!gitignore.includes(requiredGitignore)) {
      throw new Error(`Extracted framework .gitignore is missing: ${requiredGitignore}`);
    }
  }

  const packageCi = readFileSync(join(tempDir, ".github/workflows/ci.yml"), "utf8");
  const giteaPackageCi = readFileSync(join(tempDir, ".gitea/workflows/ci.yaml"), "utf8");
  const giteaPublishWorkflow = readFileSync(
    join(tempDir, ".gitea/workflows/publish-next.yaml"),
    "utf8",
  );
  if (!packageCi.includes("permissions:\n  contents: read")) {
    throw new Error("Extracted framework CI must keep contents: read permissions");
  }
  if (!giteaPublishWorkflow.includes("permissions:\n  contents: write")) {
    throw new Error("Extracted framework Gitea publish workflow must use contents: write");
  }
  for (const requiredGate of [
    "node-version: [20, 22, 24]",
    "npm ci",
    "npm run lint:all",
    "npm run check:tsgo",
    "npm run test",
    "npm run check:packages",
    "npm audit --omit=dev --audit-level=high",
    "Secret scan",
  ]) {
    if (!packageCi.includes(requiredGate)) {
      throw new Error(`Extracted framework CI is missing gate: ${requiredGate}`);
    }
    if (!giteaPackageCi.includes(requiredGate)) {
      throw new Error(`Extracted framework Gitea CI is missing gate: ${requiredGate}`);
    }
  }

  for (const requiredPublishGate of [
    "workflow_dispatch",
    "NPM_REGISTRY_TOKEN",
    "npm run check:packages",
    "BESLISMODEL_PUBLISH_CONFIRM",
    "npm run check:package-publish-next -- --publish",
    "BESLISMODEL_REGISTRY_SMOKE_VERSION",
    "npm run check:package-registry-smoke",
    "Tag package release notes",
    "beslismodel-v$version",
    "docs/package-release-notes-$version.md",
    "git tag -a",
    'git push origin "$tag"',
  ]) {
    if (!giteaPublishWorkflow.includes(requiredPublishGate)) {
      throw new Error(
        `Extracted framework Gitea publish workflow is missing: ${requiredPublishGate}`,
      );
    }
  }

  execFileSync("npm", ["ci"], { cwd: tempDir, stdio: "inherit" });
  execFileSync("npm", ["run", "format:check"], { cwd: tempDir, stdio: "inherit" });
  execFileSync("npm", ["run", "lint:all"], { cwd: tempDir, stdio: "inherit" });
  execFileSync("npm", ["run", "check"], { cwd: tempDir, stdio: "inherit" });
  execFileSync("npm", ["run", "check:tsgo"], { cwd: tempDir, stdio: "inherit" });
  execFileSync("npm", ["run", "check:package-registry-smoke:config"], {
    cwd: tempDir,
    stdio: "inherit",
  });
  execFileSync("npm", ["run", "check:packages"], { cwd: tempDir, stdio: "inherit" });

  console.log("Standalone framework extraction smoke passed");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
