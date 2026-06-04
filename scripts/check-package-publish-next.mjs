import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expectedPackageRegistry, getFrameworkPackages } from "./package-extraction-map.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isPublish = process.argv.includes("--publish");
const packages = getFrameworkPackages(root);
const registryUrl = new URL(expectedPackageRegistry);
const registryAuthConfigKey = `//${registryUrl.host}${registryUrl.pathname}:_authToken`;
const tokenEnvNames = ["NODE_AUTH_TOKEN", "NPM_TOKEN", "NPM_REGISTRY_TOKEN", "GITEA_NPM_TOKEN"];

const packageNames = new Set(packages.map((item) => item.name));
const prereleaseVersionPattern = /^\d+\.\d+\.\d+-[0-9A-Za-z.-]+$/;
const stableVersionPattern = /^\d+\.\d+\.\d+$/;
const publishTag = process.env.BESLISMODEL_PUBLISH_TAG?.trim() || "next";
const allowedPublishTags = new Set(["latest", "next"]);

const fail = (message) => {
  throw new Error(message);
};

if (!allowedPublishTags.has(publishTag)) {
  fail(`BESLISMODEL_PUBLISH_TAG must be "next" or "latest", received ${publishTag}`);
}

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
const npmWhoamiUnsupported = (detail) => /E404|404|not found|\/-\/whoami/i.test(detail);
const tokenFromNpmConfig = (cacheDir) => {
  try {
    const value = execFileSync(
      "npm",
      ["--cache", cacheDir, "config", "get", registryAuthConfigKey],
      {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    ).trim();
    if (value && value !== "undefined" && value !== "null") return value;
  } catch {
    return "";
  }
  return "";
};
const resolvePublishToken = (cacheDir) => {
  for (const name of tokenEnvNames) {
    const value = process.env[name]?.trim();
    if (value) return { source: name, token: value };
  }
  const token = tokenFromNpmConfig(cacheDir);
  if (token) return { source: "npm config", token };
  return { source: "", token: "" };
};

async function verifyGiteaApiAuth(tokenSource, token) {
  const userEndpoint = new URL("/api/v1/user", registryUrl.origin).toString();
  for (const scheme of ["token", "Bearer"]) {
    const response = await fetch(userEndpoint, {
      headers: {
        Authorization: `${scheme} ${token}`,
      },
    });
    if (response.ok) {
      const user = await response.json();
      console.log(
        `Registry auth verified through Gitea API using ${tokenSource} as ${user.login ?? "unknown"}`,
      );
      return;
    }
    if (response.status !== 401 && response.status !== 403) {
      fail(`Gitea API auth preflight failed with HTTP ${response.status} at ${userEndpoint}`);
    }
  }
  fail(`Gitea API rejected publish token from ${tokenSource} for ${registryUrl.origin}`);
}

async function verifyPublishAuth(cacheDir) {
  const resolvedToken = resolvePublishToken(cacheDir);
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
    return resolvedToken;
  } catch (error) {
    const detail = errorDetail(error);
    const { source, token } = resolvedToken;
    if (!npmWhoamiUnsupported(detail) && !token) {
      fail(
        `Publishing requires npm auth for ${expectedPackageRegistry}. ` +
          `Run npm whoami --registry ${expectedPackageRegistry} first.\n${detail}`,
      );
    }

    if (!token) {
      fail(
        `Gitea registry does not support npm whoami at ${expectedPackageRegistry}; ` +
          `set ${tokenEnvNames.join(", ")} or user-level npm auth for ${registryAuthConfigKey}.`,
      );
    }
    await verifyGiteaApiAuth(source, token);
    return resolvedToken;
  }
}

function createPublishEnv(cacheDir, token) {
  if (!token) return process.env;
  const npmrcPath = resolve(cacheDir, "publish.npmrc");
  writeFileSync(
    npmrcPath,
    [
      `@beslismodel:registry=${expectedPackageRegistry}`,
      `${registryAuthConfigKey}=${token}`,
      "",
    ].join("\n"),
  );
  return {
    ...process.env,
    GITEA_NPM_TOKEN: process.env.GITEA_NPM_TOKEN || token,
    NODE_AUTH_TOKEN: process.env.NODE_AUTH_TOKEN || token,
    NPM_TOKEN: process.env.NPM_TOKEN || token,
    npm_config_userconfig: npmrcPath,
  };
}
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
if (publishTag === "next" && !prereleaseVersionPattern.test(version)) {
  fail(
    `Package version must be a semver prerelease before publishing with dist-tag next, received: ${version}`,
  );
}
if (publishTag === "latest" && !stableVersionPattern.test(version)) {
  fail(
    `Package version must be a stable semver before publishing with dist-tag latest, received: ${version}`,
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
  const findExistingPublishedPackages = (npmEnv = process.env) =>
    packages.map(({ name }) => {
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
            env: npmEnv,
            stdio: ["ignore", "pipe", "pipe"],
          },
        ).trim();
        return { exists: publishedVersion === version, name };
      } catch (error) {
        const detail = errorDetail(error);
        if (/E404|404|not found/i.test(detail)) return { exists: false, name };
        fail(
          `Could not verify whether ${name}@${version} already exists in ${expectedPackageRegistry}.\n${detail}`,
        );
      }
    });

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
    console.log(`Pack dry-run checked ${name}@${version} with dist-tag ${publishTag}`);
  };

  for (const { dir, name } of packages) {
    packPackage({ dir, name });
  }

  if (!isPublish) {
    console.log(
      `Package ${publishTag}-publish dry-run passed for @beslismodel packages ${version}`,
    );
  } else {
    const publishAuth = await verifyPublishAuth(cacheDir);
    const publishEnv = createPublishEnv(cacheDir, publishAuth.token);

    const existingPackages = findExistingPublishedPackages(publishEnv);
    const alreadyPublished = existingPackages.filter((item) => item.exists);
    if (alreadyPublished.length === packages.length) {
      console.log(
        `All @beslismodel packages ${version} already exist in ${expectedPackageRegistry}; publish step skipped`,
      );
      process.exit(0);
    }
    if (alreadyPublished.length > 0) {
      fail(
        [
          `Refusing partial publish for ${version}; registry already contains:`,
          ...alreadyPublished.map((item) => `- ${item.name}@${version}`),
        ].join("\n"),
      );
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
          publishTag,
          "--registry",
          expectedPackageRegistry,
        ],
        {
          cwd: root,
          env: publishEnv,
          stdio: "inherit",
        },
      );
      console.log(`Published ${name}@${version} with dist-tag ${publishTag}`);
    }

    console.log(
      `Published @beslismodel packages ${version} to ${expectedPackageRegistry} with dist-tag ${publishTag}`,
    );
  }
} finally {
  rmSync(cacheDir, { recursive: true, force: true });
}
