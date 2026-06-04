import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getFrameworkPackageNames } from "./package-extraction-map.mjs";

const runtimePackageNames = new Set(["@beslismodel/core", "@beslismodel/vue"]);
const packageSourcePathPattern = /^\.\/packages\/[^/]+\/src\/index\.ts$/u;
const packageSourceGlob = "packages/**/*.ts";

function parseArgs(args = process.argv.slice(2), env = process.env) {
  const rootIndex = args.indexOf("--root");
  const versionIndex = args.indexOf("--version");
  const version =
    (versionIndex >= 0 ? args[versionIndex + 1] : undefined) ??
    env.BESLISMODEL_REGISTRY_MIGRATION_VERSION ??
    env.BESLISMODEL_REGISTRY_SMOKE_VERSION ??
    "";

  return {
    root: resolve(rootIndex >= 0 && args[rootIndex + 1] ? args[rootIndex + 1] : "."),
    version,
    write: args.includes("--write"),
  };
}

function assertExactVersion(version) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(version)) {
    throw new Error(
      "Set an exact registry package version with --version, BESLISMODEL_REGISTRY_MIGRATION_VERSION, or BESLISMODEL_REGISTRY_SMOKE_VERSION.",
    );
  }
}

function sortedObject(value) {
  return Object.fromEntries(
    Object.entries(value ?? {}).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function migratePackageJson(source, packageNames, version) {
  const manifest = JSON.parse(source);
  const dependencies = { ...(manifest.dependencies ?? {}) };
  const devDependencies = { ...(manifest.devDependencies ?? {}) };

  for (const packageName of packageNames) {
    delete dependencies[packageName];
    delete devDependencies[packageName];
    if (runtimePackageNames.has(packageName)) dependencies[packageName] = version;
    else devDependencies[packageName] = version;
  }

  manifest.dependencies = sortedObject(dependencies);
  manifest.devDependencies = sortedObject(devDependencies);
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function migrateTsconfig(source, packageNames) {
  const config = JSON.parse(source);
  const paths = { ...(config.compilerOptions?.paths ?? {}) };
  for (const packageName of packageNames) {
    const [path] = paths[packageName] ?? [];
    if (typeof path === "string" && packageSourcePathPattern.test(path)) {
      delete paths[packageName];
    }
  }
  config.compilerOptions = {
    ...config.compilerOptions,
    paths,
  };
  config.include = (config.include ?? []).filter((item) => item !== packageSourceGlob);
  return `${JSON.stringify(config, null, 2)}\n`;
}

function removePackageAliasEntries(source, packageNames) {
  const names = packageNames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")).join("|");
  const aliasLinePattern = new RegExp(
    String.raw`\n\s+"(?:${names})":\s+new URL\("\./packages/[^"]+/src/index\.ts", import\.meta\.url\)\s*\.pathname,?`,
    "gu",
  );
  return source.replace(aliasLinePattern, "");
}

function removeEmptyResolveAliasBlock(source) {
  return source
    .replace(/\n\s*resolve:\s*\{\s*alias:\s*\{\s*\},?\s*\},?/u, "")
    .replace(/,\s*\n\s*test:/u, ",\n  test:");
}

function migrateViteConfig(source, packageNames) {
  return removeEmptyResolveAliasBlock(removePackageAliasEntries(source, packageNames));
}

function migrateVitestConfig(source, packageNames) {
  return removeEmptyResolveAliasBlock(removePackageAliasEntries(source, packageNames));
}

export function buildRegistryMigrationPlan(root, version) {
  assertExactVersion(version);
  const packageNames = getFrameworkPackageNames(root);
  const files = [
    {
      path: "package.json",
      migrate: (source) => migratePackageJson(source, packageNames, version),
    },
    {
      path: "tsconfig.json",
      migrate: (source) => migrateTsconfig(source, packageNames),
    },
    {
      path: "vite.config.js",
      migrate: (source) => migrateViteConfig(source, packageNames),
    },
    {
      path: "vitest.config.ts",
      migrate: (source) => migrateVitestConfig(source, packageNames),
    },
  ];

  return files.map((file) => {
    const absolutePath = resolve(root, file.path);
    const before = readFileSync(absolutePath, "utf8");
    const after = file.migrate(before);
    return {
      after,
      before,
      changed: before !== after,
      path: file.path,
    };
  });
}

export function applyRegistryMigration({ root, version, write }) {
  const plan = buildRegistryMigrationPlan(root, version);
  const changedFiles = plan.filter((item) => item.changed);

  if (write) {
    for (const item of changedFiles) {
      writeFileSync(resolve(root, item.path), item.after);
    }
  }

  return changedFiles.map((item) => item.path);
}

function main() {
  const options = parseArgs();
  const changedFiles = applyRegistryMigration(options);

  if (changedFiles.length === 0) {
    console.log(`Registry migration already applied for ${options.version}`);
    return;
  }

  const mode = options.write ? "Updated" : "Dry-run: would update";
  console.log(`${mode} registry consumer config for @beslismodel/* ${options.version}:`);
  for (const file of changedFiles) {
    console.log(`- ${file}`);
  }
  if (!options.write) {
    console.log("Re-run with --write after the prerelease packages exist in Gitea npm.");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
