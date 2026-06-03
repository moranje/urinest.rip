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
  for (const { dir, name } of packages) {
    const args = isPublish
      ? [
          "--cache",
          cacheDir,
          "publish",
          resolve(root, dir),
          "--tag",
          "next",
          "--registry",
          expectedPackageRegistry,
          "--ignore-scripts",
        ]
      : [
          "--cache",
          cacheDir,
          "pack",
          resolve(root, dir),
          "--dry-run",
          "--json",
          "--ignore-scripts",
        ];

    const output = execFileSync("npm", args, {
      cwd: root,
      encoding: isPublish ? undefined : "utf8",
      stdio: isPublish ? "inherit" : ["ignore", "pipe", "inherit"],
    });
    if (!isPublish) {
      const packResult = JSON.parse(output)[0];
      if (packResult.name !== name || packResult.version !== version) {
        fail(`${dir}: npm pack resolved ${packResult.name}@${packResult.version}`);
      }
    }
    console.log(
      `${isPublish ? "Published" : "Pack dry-run checked"} ${name}@${version} with dist-tag next`,
    );
  }

  console.log(
    isPublish
      ? `Published @beslismodel packages ${version} to ${expectedPackageRegistry} with dist-tag next`
      : `Package next-publish dry-run passed for @beslismodel packages ${version}`,
  );
} finally {
  rmSync(cacheDir, { recursive: true, force: true });
}
