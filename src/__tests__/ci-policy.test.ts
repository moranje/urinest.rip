import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(resolve(".github/workflows/ci.yml"), "utf8");
const releaseStrategy = readFileSync(resolve("docs/package-release-strategy.md"), "utf8");
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
    expect(workflow).toContain("npm run check:packages");
    expect(workflow).toContain("Package release config preflight");
    expect(workflow).toContain('BESLISMODEL_STRICT_NPMRC: "true"');
    expect(workflow).toContain("npm run budget");
    expect(workflow).toContain("npm run build-storybook");
    expect(workflow).toContain("node-version: [20, 22, 24]");
    expect(workflow).toContain("node-version: ${{ matrix.node-version }}");
    expect(workflow).toContain("npm run format:check");
    expect(workflow).toContain("npm run check:tsgo");
    expect(packageJson.engines?.node).toBe(">=20.19.0");
    expect(packageJson.scripts["check:consumer-imports"]).toBe(
      "node scripts/check-consumer-package-imports.mjs",
    );
    expect(packageJson.scripts["check:framework-boundaries"]).toBe(
      "node scripts/check-framework-security-boundaries.mjs",
    );
    expect(packageJson.scripts["check:packages"]).toContain("check:consumer-imports");
    expect(packageJson.scripts["check:packages"]).toContain("check:framework-boundaries");
    expect(packageJson.scripts["check:packages"]).toContain("check:package-release-config");
    expect(packageJson.scripts["check:packages"]).toContain("check:package-tarballs");
    expect(packageJson.scripts["check:packages"]).toContain("check:package-consumer-smoke");
    expect(packageJson.scripts["check:packages"]).toContain("check:cvrm-prevent-package");
    expect(packageJson.scripts["check:package-consumer-smoke"]).toBe(
      "node scripts/check-package-consumer-smoke.mjs",
    );
    expect(packageJson.scripts.budget).toContain("budget:app");
    expect(packageJson.scripts.budget).toContain("budget:packages");
    expect(packageJson.scripts["budget:packages"]).toBe(
      "node scripts/check-package-bundle-budget.mjs",
    );
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
