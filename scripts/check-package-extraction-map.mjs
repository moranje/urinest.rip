import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const map = JSON.parse(
  readFileSync(new URL("../docs/package-extraction-map.json", import.meta.url), "utf8"),
);

const expectedPackages = new Map([
  ["@beslismodel/core", "packages/core"],
  ["@beslismodel/compiler", "packages/compiler"],
  ["@beslismodel/cvrm-prevent", "packages/cvrm-prevent"],
  ["@beslismodel/vue", "packages/vue"],
  ["@beslismodel/testing", "packages/testing"],
]);

const requiredAppOnlyExclusions = [
  "flows/",
  "public/",
  "src/components/LogoSvg.vue",
  "src/components/StripSvg.vue",
  "src/config/app-config.ts",
  "src/lib/log-sink.ts",
  "src/lib/supabase/",
  "src/views/admin/",
  "src/store/logStore.ts",
  "supabase/",
];

const appOnlyPathPatterns = [
  /^flows\//u,
  /^public\//u,
  /^src\/components\/(?:Culture|Dipslide|Healthy|Logo|Sediment|Strip)Svg\.vue$/u,
  /^src\/config\/app-config\.ts$/u,
  /^src\/lib\/log-sink\.ts$/u,
  /^src\/lib\/supabase\//u,
  /^src\/store\/logStore\.ts$/u,
  /^src\/views\/admin\//u,
  /^supabase\//u,
];

const violations = [];

function fail(message) {
  violations.push(message);
}

function normalizeSource(source) {
  return source.replace(/\r\n/g, "\n");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function lineCount(value) {
  return value.split("\n").length;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function startsWithPackageRoot(path) {
  return [...expectedPackages.values()].some(
    (root) => path === root || path.startsWith(`${root}/`),
  );
}

function isAppOnlyPath(path) {
  return appOnlyPathPatterns.some((pattern) => pattern.test(path));
}

if (map.targetSiblingFolder !== "beslismodel-framework") {
  fail("targetSiblingFolder must stay beslismodel-framework");
}

if (map.policy?.mode !== "extract-to-sibling-repository") {
  fail("policy.mode must be extract-to-sibling-repository");
}

if (map.policy?.appOnlyCodeMustStayInUrinestRip !== true) {
  fail("policy.appOnlyCodeMustStayInUrinestRip must be true");
}

const packages = Array.isArray(map.packages) ? map.packages : [];
const packageNames = new Set(packages.map((item) => item.name));

for (const name of expectedPackages.keys()) {
  if (!packageNames.has(name)) fail(`missing extraction package ${name}`);
}

for (const pkg of packages) {
  const expectedRoot = expectedPackages.get(pkg.name);
  if (!expectedRoot) {
    fail(`unexpected extraction package ${pkg.name}`);
    continue;
  }

  if (pkg.sourceRoot !== expectedRoot) {
    fail(`${pkg.name}: sourceRoot must be ${expectedRoot}`);
  }
  if (pkg.destinationRoot !== expectedRoot) {
    fail(`${pkg.name}: destinationRoot must be ${expectedRoot}`);
  }
  if (pkg.packageJson !== `${expectedRoot}/package.json`) {
    fail(`${pkg.name}: packageJson must stay ${expectedRoot}/package.json`);
  }
  if (pkg.publicExportFile !== `${expectedRoot}/src/index.ts`) {
    fail(`${pkg.name}: publicExportFile must stay ${expectedRoot}/src/index.ts`);
  }

  for (const path of [pkg.sourceRoot, pkg.destinationRoot, pkg.packageJson, pkg.publicExportFile]) {
    if (!startsWithPackageRoot(path)) {
      fail(`${pkg.name}: extraction path ${path} is outside package roots`);
    }
    if (isAppOnlyPath(path)) {
      fail(`${pkg.name}: extraction path ${path} includes app-only code`);
    }
    if (!existsSync(path)) {
      fail(`${pkg.name}: extraction path ${path} does not exist`);
    }
  }

  if (existsSync(pkg.packageJson)) {
    const manifest = readJson(pkg.packageJson);
    if (manifest.name !== pkg.name) {
      fail(`${pkg.packageJson}: expected package name ${pkg.name}, got ${manifest.name}`);
    }
    if (manifest.repository?.directory !== expectedRoot) {
      fail(`${pkg.packageJson}: repository.directory must be ${expectedRoot}`);
    }
  }

  if (existsSync(pkg.publicExportFile)) {
    const source = normalizeSource(readFileSync(pkg.publicExportFile, "utf8"));
    const actualHash = sha256(source);
    const actualLineCount = lineCount(source);
    if (pkg.publicExportSha256 !== actualHash) {
      fail(`${pkg.name}: public export hash changed; update extraction map intentionally`);
    }
    if (pkg.publicExportLineCount !== actualLineCount) {
      fail(`${pkg.name}: public export line count changed; update extraction map intentionally`);
    }
  }
}

const exclusions = new Set(map.appOnlyExclusions ?? []);
for (const exclusion of requiredAppOnlyExclusions) {
  if (!exclusions.has(exclusion)) {
    fail(`appOnlyExclusions must include ${exclusion}`);
  }
}

for (const exclusion of exclusions) {
  if (startsWithPackageRoot(exclusion)) {
    fail(`appOnlyExclusions must not exclude package root ${exclusion}`);
  }
}

if (violations.length > 0) {
  throw new Error(
    `Package extraction map is not ready:\n${violations
      .map((violation) => `- ${violation}`)
      .join("\n")}`,
  );
}

console.log("Package extraction map preserves package boundaries and public export parity");
