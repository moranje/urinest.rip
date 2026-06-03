import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const extractionMap = JSON.parse(readFileSync("docs/package-extraction-map.json", "utf8"));
const appOnlyPaths = extractionMap.appOnlyExclusions.map((path) => path.replace(/\/$/u, ""));

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return path;
  });

const tempDir = mkdtempSync(join(tmpdir(), "beslismodel-framework-extract-"));

try {
  execFileSync(
    process.execPath,
    ["scripts/extract-beslismodel-framework.mjs", "--target", tempDir, "--link-node-modules"],
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

  execFileSync("npm", ["run", "format:check"], { cwd: tempDir, stdio: "inherit" });
  execFileSync("npm", ["run", "lint:all"], { cwd: tempDir, stdio: "inherit" });
  execFileSync("npm", ["run", "check"], { cwd: tempDir, stdio: "inherit" });
  execFileSync("npm", ["run", "check:tsgo"], { cwd: tempDir, stdio: "inherit" });
  execFileSync("npm", ["run", "check:packages"], { cwd: tempDir, stdio: "inherit" });

  console.log("Standalone framework extraction smoke passed");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
