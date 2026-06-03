import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  expectedPackageRegistry,
  getFrameworkPackages,
  readPackageExtractionMap,
} from "./package-extraction-map.mjs";

const root = resolve(".");
const packages = getFrameworkPackages(root);
const extractionMap = readPackageExtractionMap(root);
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const manifests = packages.map((item) => ({
  ...item,
  manifest: readJson(resolve(root, item.packageJson)),
  mapItem: extractionMap.packages.find((candidate) => candidate.name === item.name),
}));

const versions = new Set(manifests.map((item) => item.manifest.version));
const violations = [];

const fail = (message) => {
  violations.push(message);
};

if (versions.size !== 1) {
  fail(`release notes require one package version, got ${[...versions].join(", ")}`);
}

const [version] = versions;
const releaseNotesPath = resolve(root, `docs/package-release-notes-${version}.md`);
let releaseNotes = "";
try {
  releaseNotes = readFileSync(releaseNotesPath, "utf8");
} catch {
  fail(`missing release notes file: docs/package-release-notes-${version}.md`);
}

if (releaseNotes) {
  const requiredSections = [
    "## Package Set",
    "## Changed Exports",
    "## Consumer Impact",
    "## Verification",
    "## Migration",
    "## Rollback",
    "## Source Traceability",
  ];
  const requiredSnippets = [
    version,
    "Dist-tag: `next`",
    expectedPackageRegistry,
    `BESLISMODEL_PUBLISH_CONFIRM=${version}`,
    `BESLISMODEL_REGISTRY_SMOKE_VERSION=${version}`,
    "No consumer may import `packages/*/src` private source paths.",
    "Tarballs contain only `dist/` and `package.json`.",
  ];

  for (const section of requiredSections) {
    if (!releaseNotes.includes(section)) fail(`release notes missing section ${section}`);
  }

  for (const snippet of requiredSnippets) {
    if (!releaseNotes.includes(snippet)) fail(`release notes missing ${snippet}`);
  }

  for (const { dir, manifest, mapItem, name } of manifests) {
    if (!releaseNotes.includes(`\`${name}\``)) fail(`release notes missing package ${name}`);
    if (!releaseNotes.includes(`\`${dir}\``)) fail(`release notes missing package root ${dir}`);
    if (!releaseNotes.includes(manifest.version)) fail(`release notes missing version ${name}`);
    if (mapItem?.publicExportSha256 && !releaseNotes.includes(mapItem.publicExportSha256)) {
      fail(`release notes missing public export hash ${name}`);
    }
  }

  const secretPattern =
    /(?:_authToken|_password|password\s*=|username\s*=|service[_-]?role|VITE_SUPABASE)/i;
  if (secretPattern.test(releaseNotes)) {
    fail("release notes must not contain auth material or app secrets");
  }
}

if (violations.length > 0) {
  throw new Error(
    `Package release notes are not tag-ready:\n${violations
      .map((violation) => `- ${violation}`)
      .join("\n")}`,
  );
}

console.log(`Package release notes are tag-ready: docs/package-release-notes-${version}.md`);
