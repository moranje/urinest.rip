import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(resolve(".github/workflows/ci.yml"), "utf8");
const releaseStrategy = readFileSync(resolve("docs/package-release-strategy.md"), "utf8");
const lighthouseConfig = readFileSync(resolve("lighthouserc.cjs"), "utf8");
const landingTemplateTest = readFileSync(
  resolve("src/components/templates/LandingTemplate.test.ts"),
  "utf8",
);
const routeTransitionPolicyTest = readFileSync(
  resolve("src/router/view-transition-policy.test.ts"),
  "utf8",
);
const viewTransitionTest = readFileSync(resolve("src/lib/view-transition.test.ts"), "utf8");
const progressTest = readFileSync(resolve("packages", "core", "src", "progress.test.ts"), "utf8");
const tokenPolicyTest = readFileSync(resolve("src/styles/tokens.test.ts"), "utf8");
const routeVisualContractTest = readFileSync(
  resolve("src/__tests__/route-visual-contract.test.ts"),
  "utf8",
);
const packageReleaseConfigScript = readFileSync(
  resolve("scripts/check-package-release-config.mjs"),
  "utf8",
);
const packageExtractionMapScript = readFileSync(
  resolve("scripts/check-package-extraction-map.mjs"),
  "utf8",
);
const packageExtractionMap = JSON.parse(
  readFileSync(resolve("docs/package-extraction-map.json"), "utf8"),
) as {
  targetSiblingFolder?: string;
  packages?: { name: string; publicExportSha256?: string }[];
  appOnlyExclusions?: string[];
};
const clinicalCopyScript = readFileSync(resolve("scripts/check-clinical-dutch-copy.mjs"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as {
  scripts: Record<string, string>;
  engines?: Record<string, string>;
};
const expectedPackageRegistry = "https://git.oranje.wtf/api/packages/martien/npm/";
const corePackage = JSON.parse(readFileSync(resolve("packages/core/package.json"), "utf8")) as {
  name: string;
  version: string;
  description?: string;
  license?: string;
  files?: string[];
  dependencies?: Record<string, string>;
  engines?: Record<string, string>;
  publishConfig?: Record<string, string>;
  scripts?: Record<string, string>;
};
const compilerPackage = JSON.parse(
  readFileSync(resolve("packages/compiler/package.json"), "utf8"),
) as {
  name: string;
  version: string;
  description?: string;
  license?: string;
  files?: string[];
  dependencies?: Record<string, string>;
  engines?: Record<string, string>;
  publishConfig?: Record<string, string>;
  scripts?: Record<string, string>;
};
const cvrmPreventPackage = JSON.parse(
  readFileSync(resolve("packages/cvrm-prevent/package.json"), "utf8"),
) as {
  name: string;
  version: string;
  description?: string;
  license?: string;
  files?: string[];
  dependencies?: Record<string, string>;
  engines?: Record<string, string>;
  publishConfig?: Record<string, string>;
  scripts?: Record<string, string>;
};
const testingPackage = JSON.parse(
  readFileSync(resolve("packages/testing/package.json"), "utf8"),
) as {
  name: string;
  version: string;
  description?: string;
  license?: string;
  files?: string[];
  dependencies?: Record<string, string>;
  engines?: Record<string, string>;
  publishConfig?: Record<string, string>;
  scripts?: Record<string, string>;
};
const vuePackage = JSON.parse(readFileSync(resolve("packages/vue/package.json"), "utf8")) as {
  name: string;
  version: string;
  description?: string;
  license?: string;
  files?: string[];
  dependencies?: Record<string, string>;
  engines?: Record<string, string>;
  publishConfig?: Record<string, string>;
  scripts?: Record<string, string>;
};

describe("CI policy", () => {
  it("keeps dependency audit, secret scanning, package and bundle gates active", () => {
    expect(workflow).toContain("npm audit --omit=dev --audit-level=high");
    expect(workflow).toContain("Possible hardcoded JWT/key found in source code");
    expect(workflow).toContain("git ls-files --error-unmatch .env");
    expect(workflow).toContain("npm run check:framework");
    expect(workflow).toContain("Package release config preflight");
    expect(workflow).toContain('BESLISMODEL_STRICT_NPMRC: "true"');
    expect(workflow).toContain("npm run budget");
    expect(workflow).toContain("npm run build-storybook");
    expect(workflow).toContain("browser-actions/setup-chrome@v1");
    expect(workflow).toContain("CHROME_PATH: ${{ steps.setup-chrome.outputs.chrome-path }}");
    expect(workflow).toContain("npm run check:lighthouse:only");
    expect(workflow).toContain("node-version: [20, 22, 24]");
    expect(workflow).toContain("node-version: ${{ matrix.node-version }}");
    expect(workflow).toContain("npm run format:check");
    expect(workflow).toContain("npm run check:tsgo");
    expect(packageJson.engines?.node).toBe(">=20.19.0");
    expect(packageJson.scripts["check:app"]).toContain("build:flows");
    expect(packageJson.scripts["check:app"]).toContain("format:check");
    expect(packageJson.scripts["check:app"]).toContain("lint:all");
    expect(packageJson.scripts["check:app"]).toContain("check:guidelines");
    expect(packageJson.scripts["check:app"]).toContain("budget:app");
    expect(packageJson.scripts["check:app"]).toContain("build");
    expect(packageJson.scripts["check:app"]).not.toContain("build:packages");
    expect(packageJson.scripts["check:app"]).not.toContain("check:packages");
    expect(packageJson.scripts["check:framework"]).toBe("npm run check:packages");
    expect(packageJson.scripts["check:consumer-imports"]).toBe(
      "node scripts/check-consumer-package-imports.mjs",
    );
    expect(packageJson.scripts["check:framework-boundaries"]).toBe(
      "node scripts/check-framework-security-boundaries.mjs",
    );
    expect(packageJson.scripts["check:package-extraction-map"]).toBe(
      "node scripts/check-package-extraction-map.mjs",
    );
    expect(packageJson.scripts["check:framework-extract"]).toBe(
      "node scripts/check-framework-extract.mjs",
    );
    expect(packageJson.scripts["check:packages"]).toContain("check:consumer-imports");
    expect(packageJson.scripts["check:packages"]).toContain("check:framework-boundaries");
    expect(packageJson.scripts["check:packages"]).toContain("check:package-extraction-map");
    expect(packageJson.scripts["check:packages"]).toContain("check:framework-extract");
    expect(packageJson.scripts["check:packages"]).toContain("check:package-release-config");
    expect(packageJson.scripts["check:packages"]).toContain("check:package-tarballs");
    expect(packageJson.scripts["check:packages"]).toContain("check:package-consumer-smoke");
    expect(packageJson.scripts["check:packages"]).toContain(
      "check:package-file-install-consumer-smoke",
    );
    expect(packageJson.scripts["check:packages"]).toContain("check:package-publish-next");
    expect(packageJson.scripts["check:packages"]).toContain("check:package-registry-smoke:config");
    expect(packageJson.scripts["check:packages"]).toContain("check:cvrm-prevent-package");
    expect(packageJson.scripts["check:packages"]).toContain("check:mutation-pilot");
    expect(packageJson.scripts["check:mutation-pilot"]).toBe(
      "node scripts/check-core-mutation-pilot.mjs",
    );
    expect(packageJson.scripts["check:package-consumer-smoke"]).toBe(
      "node scripts/check-package-consumer-smoke.mjs",
    );
    expect(packageJson.scripts["check:package-file-install-consumer-smoke"]).toBe(
      "node scripts/check-package-file-install-consumer-smoke.mjs",
    );
    expect(packageJson.scripts["check:package-publish-next"]).toBe(
      "node scripts/check-package-publish-next.mjs",
    );
    expect(packageJson.scripts["check:package-registry-smoke"]).toBe(
      "node scripts/check-package-registry-smoke.mjs",
    );
    expect(packageJson.scripts["check:package-registry-smoke:config"]).toBe(
      "node scripts/check-package-registry-smoke.mjs --check-config",
    );
    expect(packageJson.scripts.budget).toContain("budget:app");
    expect(packageJson.scripts.budget).toContain("budget:packages");
    expect(packageJson.scripts["budget:packages"]).toBe(
      "node scripts/check-package-bundle-budget.mjs",
    );
    expect(packageJson.scripts["check:lighthouse:only"]).toBe(
      "lhci autorun --config=./lighthouserc.cjs",
    );
    expect(packageJson.scripts["check:lighthouse"]).toContain("build");
    expect(packageJson.scripts["check:lighthouse"]).toContain("check:lighthouse:only");
    expect(lighthouseConfig).toContain("http://127.0.0.1:4173/");
    expect(lighthouseConfig).toContain("http://127.0.0.1:4173/questionnaire/strip");
    expect(lighthouseConfig).toContain("http://127.0.0.1:4173/info/other.noConclusiveAbnormality");
    expect(lighthouseConfig).toContain("chromePath");
    expect(lighthouseConfig).toContain(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    );
    expect(lighthouseConfig).toContain('"categories:accessibility"');
    expect(lighthouseConfig).toContain('"categories:best-practices"');
    expect(packageJson.scripts["check:guideline-traceability"]).toBe(
      "node scripts/check-guideline-traceability.mjs",
    );
    expect(packageJson.scripts["check:clinical-copy:only"]).toBe(
      "node scripts/check-clinical-dutch-copy.mjs",
    );
    expect(packageJson.scripts["check:clinical-copy"]).toContain("build:flows");
    expect(packageJson.scripts["check:clinical-copy"]).toContain("check:clinical-copy:only");
    expect(packageJson.scripts["check:guidelines"]).toContain("build:flows");
    expect(packageJson.scripts["check:guidelines"]).toContain("check:guideline-traceability");
    expect(packageJson.scripts["check:guidelines"]).toContain("check:clinical-copy");
    expect(packageReleaseConfigScript).toContain("Project .npmrc contains auth material");
    expect(packageReleaseConfigScript).not.toContain("console.warn");
    expect(packageExtractionMapScript).toContain("publicExportSha256");
    expect(packageExtractionMapScript).toContain("appOnlyExclusions");
    expect(packageExtractionMapScript).toContain("targetSiblingFolder");
    expect(readFileSync(resolve("scripts/extract-beslismodel-framework.mjs"), "utf8")).toContain(
      "beslismodel-framework",
    );
    expect(readFileSync(resolve("scripts/check-framework-extract.mjs"), "utf8")).toContain(
      "Standalone framework extraction smoke passed",
    );
    expect(readFileSync(resolve("scripts/extract-beslismodel-framework.mjs"), "utf8")).toContain(
      "npm audit --omit=dev --audit-level=high",
    );
    expect(readFileSync(resolve("scripts/extract-beslismodel-framework.mjs"), "utf8")).toContain(
      "node-version: [20, 22, 24]",
    );
    expect(readFileSync(resolve("scripts/extract-beslismodel-framework.mjs"), "utf8")).toContain(
      "scripts/package-extraction-map.mjs",
    );
    expect(readFileSync(resolve("scripts/check-package-release-config.mjs"), "utf8")).toContain(
      "getFrameworkPackages",
    );
    expect(readFileSync(resolve("scripts/check-package-tarballs.mjs"), "utf8")).toContain(
      "getFrameworkPackages",
    );
    expect(
      readFileSync(resolve("scripts/check-package-file-install-consumer-smoke.mjs"), "utf8"),
    ).toContain("getFrameworkPackages");
    expect(readFileSync(resolve("scripts/check-package-registry-smoke.mjs"), "utf8")).toContain(
      "BESLISMODEL_REGISTRY_SMOKE_VERSION",
    );
    expect(readFileSync(resolve("scripts/check-package-publish-next.mjs"), "utf8")).toContain(
      "BESLISMODEL_PUBLISH_CONFIRM",
    );
    expect(readFileSync(resolve("scripts/check-package-publish-next.mjs"), "utf8")).toContain(
      "--tag",
    );
    expect(readFileSync(resolve("scripts/check-package-registry-smoke.mjs"), "utf8")).toContain(
      "Registry package consumer smoke passed",
    );
    expect(packageExtractionMap.targetSiblingFolder).toBe("beslismodel-framework");
    expect(packageExtractionMap.packages?.map((item) => item.name).sort()).toEqual([
      "@beslismodel/compiler",
      "@beslismodel/core",
      "@beslismodel/cvrm-prevent",
      "@beslismodel/testing",
      "@beslismodel/vue",
    ]);
    expect(packageExtractionMap.packages?.every((item) => item.publicExportSha256)).toBe(true);
    expect(packageExtractionMap.appOnlyExclusions).toEqual(
      expect.arrayContaining(["flows/", "public/", "src/views/admin/", "src/lib/log-sink.ts"]),
    );
    expect(clinicalCopyScript).toContain("../public/main.json");
    expect(clinicalCopyScript).toContain("visibleStringKeys");
    expect(clinicalCopyScript).toContain("blockedEnglishTerms");
    expect(clinicalCopyScript).toContain("metadata");
  });

  it("keeps framework package release policy explicit and lockstep", () => {
    const packages = [corePackage, compilerPackage, cvrmPreventPackage, testingPackage, vuePackage];
    const versions = new Set(packages.map((manifest) => manifest.version));

    expect(packages.map((manifest) => manifest.name).sort()).toEqual([
      "@beslismodel/compiler",
      "@beslismodel/core",
      "@beslismodel/cvrm-prevent",
      "@beslismodel/testing",
      "@beslismodel/vue",
    ]);
    expect(versions.size).toBe(1);
    expect(cvrmPreventPackage.dependencies?.["@beslismodel/core"]).toBe(corePackage.version);
    expect(testingPackage.dependencies?.["@beslismodel/core"]).toBe(corePackage.version);
    expect(vuePackage.dependencies?.["@beslismodel/core"]).toBe(corePackage.version);
    for (const manifest of packages) {
      expect(manifest.description).toBeTruthy();
      expect(manifest.license).toBe("GPL-3.0-only");
      expect(manifest.files).toEqual(["dist"]);
      expect(manifest.engines?.node).toBe(">=20.19.0");
      expect(manifest.publishConfig?.registry).toBe(expectedPackageRegistry);
      expect(manifest.scripts?.prepack).toContain("run build:");
    }
    expect(releaseStrategy).toContain("All five packages use same version");
    expect(releaseStrategy).toContain("publishConfig.registry");
    expect(releaseStrategy).toContain("dist-tag `next`");
    expect(releaseStrategy).toContain("Registry Smoke");
    expect(releaseStrategy).toContain("file-tarball install smoke");
    expect(releaseStrategy).toContain("Rollback");
    expect(releaseStrategy).toContain("Node `20`, `22` and `24`");
    expect(releaseStrategy).toContain("sibling folder `beslismodel-framework/`");
    expect(releaseStrategy).toContain("Project `.npmrc` may define the scope registry");
    expect(releaseStrategy).toContain("must not contain a token");
    expect(releaseStrategy).toContain("exact registry versions");
    expect(releaseStrategy).toContain("landing-grid regression");
    expect(releaseStrategy).toContain("Urinestrip end-to-end fixture");
  });

  it("keeps critical UI regression tests for landing, transitions and progress", () => {
    expect(landingTemplateTest).toContain("keeps the desktop landing grid at 2 rows by 3 columns");
    expect(landingTemplateTest).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(landingTemplateTest).toContain("keeps landing menu tiles dimensionally stable");
    expect(tokenPolicyTest).toContain("five primary flows render as 2 rows x 3 columns");
    expect(tokenPolicyTest).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");

    expect(routeTransitionPolicyTest).toContain("keeps questionnaire redirects out");
    expect(routeTransitionPolicyTest).toContain("keeps result navigation out");
    expect(viewTransitionTest).toContain("classifies skipped transitions as benign");
    expect(viewTransitionTest).toContain("swallows skipped transition promise rejections");

    expect(progressTest).toContain("returns a bounded fallback without questionnaire data");
    expect(progressTest).toContain("keeps conditional future questions out");

    expect(routeVisualContractTest).toContain(
      "keeps route views wired to template-level visual shells",
    );
    expect(routeVisualContractTest).toContain("keeps landing route at desktop 2 rows by 3 columns");
    expect(routeVisualContractTest).toContain(
      "keeps questionnaire route transition, progress and grouped-input layout stable",
    );
    expect(routeVisualContractTest).toContain(
      "keeps result and admin routes bounded by content tokens",
    );
  });
});
