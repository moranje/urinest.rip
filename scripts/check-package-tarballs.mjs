import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const packages = [
  { dir: "packages/core", name: "@beslismodel/core" },
  { dir: "packages/compiler", name: "@beslismodel/compiler" },
  { dir: "packages/vue", name: "@beslismodel/vue" },
  { dir: "packages/testing", name: "@beslismodel/testing" },
];

const allowedPackageFile = (path) => path === "package.json" || path.startsWith("dist/");
const cacheDir = mkdtempSync(join(tmpdir(), "beslismodel-pack-cache-"));

try {
  const violations = [];

  for (const { dir, name } of packages) {
    const output = execFileSync(
      "npm",
      ["--cache", cacheDir, "pack", "--dry-run", "--json", `./${dir}`, "--ignore-scripts"],
      { encoding: "utf8" },
    );
    const packResult = JSON.parse(output)[0];
    if (packResult.name !== name) {
      violations.push(`${dir}: expected tarball name ${name}, received ${packResult.name}`);
      continue;
    }

    const files = packResult.files.map((file) => file.path);
    const unexpectedFiles = files.filter((file) => !allowedPackageFile(file));
    if (unexpectedFiles.length > 0) {
      violations.push(
        `${dir}: tarball contains non-dist files:\n${unexpectedFiles
          .map((file) => `  - ${file}`)
          .join("\n")}`,
      );
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `Package tarballs are not release-ready:\n${violations
        .map((violation) => `- ${violation}`)
        .join("\n")}`,
    );
  }

  console.log("Package tarballs contain only dist artefacts and package manifests");
} finally {
  rmSync(cacheDir, { recursive: true, force: true });
}
