import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expectedPackageRegistry, getFrameworkPackages } from "./package-extraction-map.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isPublish = process.argv.includes("--publish");
const packages = getFrameworkPackages(root);

const packageNames = new Set(packages.map((item) => item.name));
const prereleaseVersionPattern = /^\d+\.\d+\.\d+-[0-9A-Za-z.-]+$/;

const fail = (message) => {
  throw new Error(message);
};

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const parseNpmPackJson = (output) => {
  const trimmed = output.trim();
  const start = Math.max(trimmed.lastIndexOf("\n["), trimmed.lastIndexOf("[{"));
  const jsonText = start >= 0 ? trimmed.slice(start).trim() : trimmed;
  return JSON.parse(jsonText)[0];
};
const errorDetail = (error) =>
  [error?.stdout, error?.stderr, error?.message]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join("\n");
const manifests = packages.map((item) => ({
  ...item,
  manifest: readJson(resolve(root, item.dir, "package.json")),
}));

const versions = new Set(manifests.map(({ manifest }) => manifest.version));
if (versions.size !== 1) {
  fail(
    `All @beslismodel packages must use one release version, received: ${[...versions].join(", ")}`,
  );
}

const [version] = versions;
if (!prereleaseVersionPattern.test(version)) {
  fail(
    `Package version must be a semver prerelease before publishing with dist-tag next, received: ${version}`,
  );
}

for (const { dir, manifest, name } of manifests) {
  if (manifest.name !== name) {
    fail(`${dir}: expected package name ${name}, received ${manifest.name}`);
  }
  if (manifest.private !== false) {
    fail(`${dir}: package must be publishable with private=false`);
  }
  if (manifest.publishConfig?.registry !== expectedPackageRegistry) {
    fail(`${dir}: publishConfig.registry must be ${expectedPackageRegistry}`);
  }
  if (
    !Array.isArray(manifest.files) ||
    manifest.files.length !== 1 ||
    manifest.files[0] !== "dist"
  ) {
    fail(`${dir}: files must contain only dist`);
  }

  for (const [dependency, range] of Object.entries(manifest.dependencies ?? {})) {
    if (packageNames.has(dependency) && range !== version) {
      fail(`${dir}: internal dependency ${dependency} must pin ${version}, received ${range}`);
    }
  }
}

if (isPublish && process.env.BESLISMODEL_PUBLISH_CONFIRM !== version) {
  fail(
    `Publishing requires BESLISMODEL_PUBLISH_CONFIRM=${version}; dry-run is default and needs no token.`,
  );
}

const cacheDir = mkdtempSync(resolve(tmpdir(), "beslismodel-publish-cache-"));

try {
  const packPackage = ({ dir, name }) => {
    const output = execFileSync(
      "npm",
      ["--cache", cacheDir, "pack", resolve(root, dir), "--dry-run", "--json"],
      {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "inherit"],
      },
    );
    const packResult = parseNpmPackJson(output);
    if (packResult.name !== name || packResult.version !== version) {
      fail(`${dir}: npm pack resolved ${packResult.name}@${packResult.version}`);
    }
    console.log(`Pack dry-run checked ${name}@${version} with dist-tag next`);
  };

  for (const { dir, name } of packages) {
    packPackage({ dir, name });
  }

  if (!isPublish) {
    console.log(`Package next-publish dry-run passed for @beslismodel packages ${version}`);
  } else {
    try {
      const whoami = execFileSync(
        "npm",
        ["--cache", cacheDir, "whoami", "--registry", expectedPackageRegistry],
        {
          cwd: root,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        },
      ).trim();
      if (!whoami) {
        fail(`npm whoami returned an empty user for ${expectedPackageRegistry}`);
      }
      console.log(`Registry auth verified for ${expectedPackageRegistry} as ${whoami}`);
    } catch (error) {
      fail(
        `Publishing requires npm auth for ${expectedPackageRegistry}. ` +
          `Run npm whoami --registry ${expectedPackageRegistry} first.\n${errorDetail(error)}`,
      );
    }

    for (const { name } of packages) {
      try {
        const publishedVersion = execFileSync(
          "npm",
          [
            "--cache",
            cacheDir,
            "view",
            `${name}@${version}`,
            "version",
            "--registry",
            expectedPackageRegistry,
          ],
          {
            cwd: root,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
          },
        ).trim();
        if (publishedVersion === version) {
          fail(`${name}@${version} already exists in ${expectedPackageRegistry}`);
        }
      } catch (error) {
        const detail = errorDetail(error);
        if (!/E404|404|not found/i.test(detail)) {
          fail(
            `Could not verify whether ${name}@${version} already exists in ${expectedPackageRegistry}.\n${detail}`,
          );
        }
      }
    }

    for (const { dir, name } of packages) {
      execFileSync(
        "npm",
        [
          "--cache",
          cacheDir,
          "publish",
          resolve(root, dir),
          "--tag",
          "next",
          "--registry",
          expectedPackageRegistry,
        ],
        {
          cwd: root,
          stdio: "inherit",
        },
      );
      console.log(`Published ${name}@${version} with dist-tag next`);
    }

    console.log(
      `Published @beslismodel packages ${version} to ${expectedPackageRegistry} with dist-tag next`,
    );
  }
} finally {
  rmSync(cacheDir, { recursive: true, force: true });
}
