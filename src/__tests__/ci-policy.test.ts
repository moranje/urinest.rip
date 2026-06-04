import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(resolve(".github/workflows/ci.yml"), "utf8");
const giteaCiWorkflow = readFileSync(resolve(".gitea/workflows/ci.yaml"), "utf8");
const giteaReleaseWorkflow = readFileSync(resolve(".gitea/workflows/release.yaml"), "utf8");
const readme = readFileSync(resolve("README.md"), "utf8");
const claudeInstructions = readFileSync(resolve("CLAUDE.md"), "utf8");
const releaseStrategy = readFileSync(resolve("docs/package-release-strategy.md"), "utf8");
const latestCodeAudit = readFileSync(resolve("docs/audit-2026-05-22.md"), "utf8");
const latestDesignAudit = readFileSync(resolve("docs/design-audit-2026-05-21.md"), "utf8");
const nasHandoff = readFileSync(resolve("docs/nas-handoff-2026-06-04.md"), "utf8");
const agentInstructions = readFileSync(resolve("AGENTS.md"), "utf8");
const gitignore = readFileSync(resolve(".gitignore"), "utf8");
const envExample = readFileSync(resolve(".env.example"), "utf8");
const appConfigSource = readFileSync(resolve("src/config/app-config.ts"), "utf8");
const appCompatibilitySource = readFileSync(resolve("src/lib/app-compatibility.ts"), "utf8");
const telemetryDocs = readFileSync(resolve("docs/telemetry.md"), "utf8");
const lighthouseConfig = readFileSync(resolve("lighthouserc.cjs"), "utf8");
const storybookMain = readFileSync(resolve(".storybook/main.ts"), "utf8");
const storybookPreview = readFileSync(resolve(".storybook/preview.ts"), "utf8");
const landingTemplateTest = readFileSync(
  resolve("src/components/templates/LandingTemplate.test.ts"),
  "utf8",
);
const multiInputPanelTest = readFileSync(
  resolve("src/components/organisms/MultiInputPanel.test.ts"),
  "utf8",
);
const routeAccessibilityTest = readFileSync(
  resolve("src/__tests__/accessibility-route.test.ts"),
  "utf8",
);
const routeTransitionPolicyTest = readFileSync(
  resolve("src/router/view-transition-policy.test.ts"),
  "utf8",
);
const viewTransitionTest = readFileSync(resolve("src/lib/view-transition.test.ts"), "utf8");
const progressTest = readFileSync(resolve("packages", "core", "src", "progress.test.ts"), "utf8");
const tokenPolicyTest = readFileSync(resolve("src/styles/tokens.test.ts"), "utf8");
const themeStoreTest = readFileSync(resolve("src/store/themeStore.test.ts"), "utf8");
const themeInitTest = readFileSync(resolve("src/lib/__tests__/theme-init.test.ts"), "utf8");
const designTokenDistributionScript = readFileSync(
  resolve("scripts/check-design-token-distribution.mjs"),
  "utf8",
);
const designTokenDistributionDoc = readFileSync(
  resolve("docs/design-token-distribution.md"),
  "utf8",
);
const designTokenDistributionManifest = JSON.parse(
  readFileSync(resolve("docs/design-token-distribution.json"), "utf8"),
) as {
  source?: Record<string, string>;
  targets?: { id: string; status: string }[];
  governance?: { parityChecks?: string[]; customMd3Extensions?: string[] };
  counts?: { total?: number; byType?: Record<string, number> };
};
const routeVisualContractTest = readFileSync(
  resolve("src/__tests__/route-visual-contract.test.ts"),
  "utf8",
);
const browserRegressionSmokeScript = readFileSync(
  resolve("scripts/check-browser-regression-smoke.mjs"),
  "utf8",
);
const registryMigrationScript = readFileSync(
  resolve("scripts/migrate-to-beslismodel-registry.mjs"),
  "utf8",
);
const registrySmokeVersionPolicy = readFileSync(
  resolve("scripts/package-registry-smoke-version.mjs"),
  "utf8",
);
const mutationPilotScript = readFileSync(resolve("scripts/check-core-mutation-pilot.mjs"), "utf8");
const packageVitestConfig = readFileSync(resolve("vitest.config.packages.ts"), "utf8");
const packageReleaseConfigScript = readFileSync(
  resolve("scripts/check-package-release-config.mjs"),
  "utf8",
);
const packageExtractionMapScript = readFileSync(
  resolve("scripts/check-package-extraction-map.mjs"),
  "utf8",
);
const frameworkExtractScript = readFileSync(
  resolve("scripts/extract-beslismodel-framework.mjs"),
  "utf8",
);
const packageExtractionMap = JSON.parse(
  readFileSync(resolve("docs/package-extraction-map.json"), "utf8"),
) as {
  targetSiblingFolder?: string;
  packages?: {
    name: string;
    publicExportSha256?: string;
    sourceTreeFileCount: number;
    sourceTreeSha256: string;
  }[];
  appOnlyExclusions?: string[];
};
const clinicalCopyScript = readFileSync(resolve("scripts/check-clinical-dutch-copy.mjs"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as {
  scripts: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: Record<string, string>;
};
const packageLock = JSON.parse(readFileSync(resolve("package-lock.json"), "utf8")) as {
  packages?: Record<string, { version?: string; resolved?: string }>;
};
const expectedPackageRegistry = "https://git.oranje.wtf/api/packages/martien/npm/";
const expectedPackageHomepage = "https://git.oranje.wtf/martien/beslismodel-framework";
const expectedPackageBugsUrl = "https://git.oranje.wtf/martien/beslismodel-framework/issues";
const expectedPackageRepositoryUrl = "git+https://git.oranje.wtf/martien/beslismodel-framework.git";
const corePackage = JSON.parse(readFileSync(resolve("packages/core/package.json"), "utf8")) as {
  name: string;
  version: string;
  description?: string;
  license?: string;
  homepage?: string;
  bugs?: { url?: string };
  repository?: { type?: string; url?: string; directory?: string };
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
  homepage?: string;
  bugs?: { url?: string };
  repository?: { type?: string; url?: string; directory?: string };
  files?: string[];
  dependencies?: Record<string, string>;
  engines?: Record<string, string>;
  publishConfig?: Record<string, string>;
  scripts?: Record<string, string>;
};
const copdCarePackage = JSON.parse(
  readFileSync(resolve("packages/copd-care/package.json"), "utf8"),
) as {
  name: string;
  version: string;
  description?: string;
  license?: string;
  homepage?: string;
  bugs?: { url?: string };
  repository?: { type?: string; url?: string; directory?: string };
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
  homepage?: string;
  bugs?: { url?: string };
  repository?: { type?: string; url?: string; directory?: string };
  files?: string[];
  dependencies?: Record<string, string>;
  engines?: Record<string, string>;
  publishConfig?: Record<string, string>;
  scripts?: Record<string, string>;
};
const dmCarePackage = JSON.parse(
  readFileSync(resolve("packages/dm-care/package.json"), "utf8"),
) as {
  name: string;
  version: string;
  description?: string;
  license?: string;
  homepage?: string;
  bugs?: { url?: string };
  repository?: { type?: string; url?: string; directory?: string };
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
  homepage?: string;
  bugs?: { url?: string };
  repository?: { type?: string; url?: string; directory?: string };
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
  homepage?: string;
  bugs?: { url?: string };
  repository?: { type?: string; url?: string; directory?: string };
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
    expect(workflow).toContain("Browser regression smoke");
    expect(workflow).toContain("npm run check:browser-smoke");
    expect(workflow).toContain("Package release config preflight");
    expect(workflow).toContain('BESLISMODEL_STRICT_NPMRC: "true"');
    expect(workflow).toContain("npm run budget");
    expect(workflow).toContain("npm run build-storybook");
    expect(workflow).toContain("browser-actions/setup-chrome@v1");
    expect(workflow).toContain("CHROME_PATH: ${{ steps.setup-chrome.outputs.chrome-path }}");
    expect(workflow).toContain("npm run check:lighthouse:only");
    expect(workflow).toContain("sourcemaps/urinest.rip/${RELEASE_VERSION}/${NAME}");
    expect(workflow).toContain('RELEASE_VERSION="${{ steps.release.outputs.version }}"');
    expect(workflow).toContain("node-version: [20, 22, 24]");
    expect(workflow).toContain("node-version: ${{ matrix.node-version }}");
    expect(workflow).toContain("npm run format:check");
    expect(workflow).toContain("npm run check:tsgo");
    expect(packageJson.engines?.node).toBe(">=20.19.0");
    expect(packageJson.scripts["check:app"]).toContain("build:flows");
    expect(packageJson.scripts["check:app"]).toContain("check:design-tokens");
    expect(packageJson.scripts["check:app"]).toContain("check:design-token-distribution");
    expect(packageJson.scripts["tokens:distribution:write"]).toBe(
      "node scripts/check-design-token-distribution.mjs --write",
    );
    expect(packageJson.scripts["check:design-token-distribution"]).toBe(
      "node scripts/check-design-token-distribution.mjs",
    );
    expect(packageJson.scripts["check:app"]).toContain("format:check");
    expect(packageJson.scripts["check:app"]).toContain("lint:all");
    expect(packageJson.scripts["check:app"]).toContain("check:guidelines");
    expect(packageJson.scripts["check:app"]).toContain("budget:app");
    expect(packageJson.scripts["check:app"]).toContain("build");
    expect(packageJson.scripts["check:app"]).not.toContain("build:packages");
    expect(packageJson.scripts["check:app"]).not.toContain("check:packages");
    expect(envExample).toContain("VITE_TELEMETRY_SOURCE=urinestrip");
    expect(envExample).toContain("VITE_ENABLE_LOG_PERSISTENCE=false");
    expect(appConfigSource).toContain("VITE_TELEMETRY_SOURCE");
    expect(appConfigSource).toContain("resolveTelemetrySource");
    expect(telemetryDocs).toContain("VITE_TELEMETRY_SOURCE");
    expect(telemetryDocs).toContain("consumer apps");
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
    expect(packageJson.scripts["check:packages"]).toContain("check:package-release-notes");
    expect(packageJson.scripts["check:packages"]).toContain("test:packages");
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
    expect(packageJson.scripts.test).toContain("test:app");
    expect(packageJson.scripts.test).toContain("test:packages");
    expect(packageJson.scripts["test:packages"]).toBe(
      "vitest run --config vitest.config.packages.ts",
    );
    expect(frameworkExtractScript).toContain(
      '"test:packages": "vitest run --config vitest.config.ts"',
    );
    expect(frameworkExtractScript).toContain("npm run build:packages && npm run test:packages");
    expect(packageVitestConfig).toContain('include: ["packages/**/*.test.ts"]');
    expect(packageVitestConfig).toContain("@beslismodel/core");
    expect(mutationPilotScript).toContain("vitest.config.packages.ts");
    expect(mutationPilotScript).toContain('"--config", vitestConfig');
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
    expect(packageJson.scripts["check:package-registry-smoke:current"]).toBe(
      "node scripts/check-package-registry-smoke.mjs --current-version",
    );
    expect(packageJson.scripts["check:browser-smoke"]).toBe(
      "node scripts/check-browser-regression-smoke.mjs",
    );
    expect(packageJson.scripts["migrate:registry-deps"]).toBe(
      "node scripts/migrate-to-beslismodel-registry.mjs",
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
    expect(packageJson.scripts["check:modern-toolchain"]).toBe(
      "node scripts/check-modern-toolchain.mjs",
    );
    expect(designTokenDistributionScript).toContain("style-dictionary-v4");
    expect(designTokenDistributionScript).toContain("tokens-studio-figma");
    expect(designTokenDistributionScript).toContain("web-runtime-css");
    expect(designTokenDistributionScript).toContain("theme-bootstrap");
    expect(designTokenDistributionDoc).toContain("style-dictionary-v4");
    expect(designTokenDistributionDoc).toContain("tokens-studio-figma");
    expect(designTokenDistributionManifest.source?.css).toBe("src/styles/tokens.css");
    expect(designTokenDistributionManifest.source?.dtcg).toBe("src/styles/beslismodel.tokens.json");
    expect(designTokenDistributionManifest.source?.themeBootstrap).toBe("public/theme-tokens.js");
    expect(designTokenDistributionManifest.targets?.map((target) => target.id)).toEqual([
      "style-dictionary-v4",
      "tokens-studio-figma",
      "web-runtime-css",
      "theme-bootstrap",
    ]);
    expect(
      designTokenDistributionManifest.targets?.every((target) => target.status === "ready"),
    ).toBe(true);
    expect(designTokenDistributionManifest.governance?.parityChecks).toContain(
      "npm run check:design-tokens",
    );
    expect(designTokenDistributionManifest.governance?.parityChecks).toContain(
      "npm run check:design-token-distribution",
    );
    expect(designTokenDistributionManifest.governance?.customMd3Extensions).toContain(
      "md.sys.color.warning",
    );
    expect(designTokenDistributionManifest.counts?.byType?.color).toBeGreaterThan(40);
    expect(designTokenDistributionManifest.counts?.byType?.dimension).toBeGreaterThan(10);
    expect(designTokenDistributionManifest.counts?.byType?.typography).toBeGreaterThan(10);
    expect(packageJson.scripts["check:app"]).toContain("check:modern-toolchain");
    expect(packageJson.scripts["check:app"]).toContain("check:tsgo:app");
    expect(packageJson.scripts["check:app"]).toContain("test:app");
    expect(packageJson.scripts["check:app"]).not.toContain("npm run check:tsgo && npm run test");
    expect(packageJson.scripts["check:framework"]).toContain("check:packages");
    expect(packageReleaseConfigScript).toContain("Project .npmrc contains auth material");
    expect(packageReleaseConfigScript).not.toContain("console.warn");
    expect(packageExtractionMapScript).toContain("publicExportSha256");
    expect(packageExtractionMapScript).toContain("sourceTreeSha256");
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
    expect(readFileSync(resolve("scripts/extract-beslismodel-framework.mjs"), "utf8")).toContain(
      "scripts/package-smoke-fixtures.mjs",
    );
    expect(readFileSync(resolve("scripts/extract-beslismodel-framework.mjs"), "utf8")).toContain(
      "check:package-consumer-smoke",
    );
    expect(readFileSync(resolve("scripts/extract-beslismodel-framework.mjs"), "utf8")).toContain(
      ".gitea/workflows/ci.yaml",
    );
    expect(readFileSync(resolve("scripts/extract-beslismodel-framework.mjs"), "utf8")).toContain(
      "package-lock.json",
    );
    expect(readFileSync(resolve("scripts/extract-beslismodel-framework.mjs"), "utf8")).toContain(
      ".gitignore",
    );
    expect(readFileSync(resolve("scripts/extract-beslismodel-framework.mjs"), "utf8")).toContain(
      "@vue/test-utils",
    );
    expect(readFileSync(resolve("scripts/extract-beslismodel-framework.mjs"), "utf8")).toContain(
      "jsdom",
    );
    expect(readFileSync(resolve("scripts/extract-beslismodel-framework.mjs"), "utf8")).toContain(
      "docs/gitea-package-publishing.md",
    );
    expect(readFileSync(resolve("scripts/check-framework-extract.mjs"), "utf8")).toContain(
      "Extracted framework must include package-lock.json",
    );
    expect(readFileSync(resolve("scripts/check-framework-extract.mjs"), "utf8")).toContain(
      "Extracted framework Gitea CI is missing gate",
    );
    expect(readFileSync(resolve("scripts/check-framework-extract.mjs"), "utf8")).toContain(
      "contents: read",
    );
    expect(readFileSync(resolve("scripts/check-framework-extract.mjs"), "utf8")).toContain(
      "contents: write",
    );
    expect(readFileSync(resolve("scripts/check-framework-extract.mjs"), "utf8")).toContain(
      "Extracted framework .gitignore is missing",
    );
    expect(readFileSync(resolve("scripts/check-framework-extract.mjs"), "utf8")).toContain(
      'npm", ["ci"]',
    );
    expect(readFileSync(resolve("scripts/check-package-release-config.mjs"), "utf8")).toContain(
      "getFrameworkPackages",
    );
    expect(readFileSync(resolve("scripts/check-package-release-config.mjs"), "utf8")).toContain(
      "expectedPackageRegistry",
    );
    expect(readFileSync(resolve("scripts/check-package-release-config.mjs"), "utf8")).toContain(
      "BESLISMODEL_STRICT_NPMRC",
    );
    expect(readFileSync(resolve("scripts/check-package-release-config.mjs"), "utf8")).toContain(
      "BESLISMODEL_PUBLISH_TAG",
    );
    expect(readFileSync(resolve("scripts/check-package-release-config.mjs"), "utf8")).toContain(
      "stableVersionPattern",
    );
    expect(readFileSync(resolve("scripts/check-package-release-config.mjs"), "utf8")).toContain(
      "Project .npmrc must not contain auth material",
    );
    expect(readFileSync(resolve("scripts/check-package-release-config.mjs"), "utf8")).not.toContain(
      "must not define @beslismodel registry when BESLISMODEL_STRICT_NPMRC=true",
    );
    expect(readFileSync(resolve("scripts/check-package-registry-smoke.mjs"), "utf8")).toContain(
      "--current-version",
    );
    expect(readFileSync(resolve("scripts/check-package-registry-smoke.mjs"), "utf8")).toContain(
      "--check-version",
    );
    expect(readFileSync(resolve("scripts/check-package-registry-smoke.mjs"), "utf8")).toContain(
      "assertRegistrySmokeVersion",
    );
    expect(registrySmokeVersionPolicy).toContain("packageReleaseVersionPattern");
    expect(registrySmokeVersionPolicy).toContain("stable semver or semver prerelease");
    expect(registrySmokeVersionPolicy).toContain("Registry smoke requires one package version");
    expect(readFileSync(resolve("scripts/extract-beslismodel-framework.mjs"), "utf8")).toContain(
      "scripts/package-registry-smoke-version.mjs",
    );
    expect(readFileSync(resolve("scripts/check-package-publish-next.mjs"), "utf8")).toContain(
      "npm whoami --registry",
    );
    expect(readFileSync(resolve("scripts/check-package-publish-next.mjs"), "utf8")).toContain(
      "/api/v1/user",
    );
    expect(readFileSync(resolve("scripts/check-package-publish-next.mjs"), "utf8")).toContain(
      "NODE_AUTH_TOKEN",
    );
    expect(readFileSync(resolve("scripts/check-package-publish-next.mjs"), "utf8")).toContain(
      "BESLISMODEL_PUBLISH_TAG",
    );
    expect(readFileSync(resolve("scripts/check-package-publish-next.mjs"), "utf8")).toContain(
      "stableVersionPattern",
    );
    expect(readFileSync(resolve("scripts/check-package-publish-next.mjs"), "utf8")).toContain(
      "dist-tag latest",
    );
    expect(readFileSync(resolve("scripts/check-package-publish-next.mjs"), "utf8")).toContain(
      "already exists",
    );
    expect(readFileSync(resolve("scripts/check-package-publish-next.mjs"), "utf8")).toContain(
      "publish step skipped",
    );
    expect(readFileSync(resolve("scripts/check-package-publish-next.mjs"), "utf8")).toContain(
      "Refusing partial publish",
    );
    expect(readFileSync(resolve("scripts/check-package-publish-next.mjs"), "utf8")).toContain(
      "publish.npmrc",
    );
    expect(readFileSync(resolve("scripts/check-package-publish-next.mjs"), "utf8")).toContain(
      "npm_config_userconfig",
    );
    expect(readFileSync(resolve("scripts/check-package-registry-smoke.mjs"), "utf8")).toContain(
      "writeUrinestripFixtureFlows",
    );
    expect(readFileSync(resolve("scripts/check-package-registry-smoke.mjs"), "utf8")).not.toContain(
      'join(root, "flows")',
    );
    expect(readFileSync(resolve("scripts/migrate-to-beslismodel-registry.mjs"), "utf8")).toContain(
      "Registry migration --write requires published package",
    );
    expect(readFileSync(resolve("scripts/migrate-to-beslismodel-registry.mjs"), "utf8")).toContain(
      "tsconfig.tsgo.json",
    );
    const modernToolchainScript = readFileSync(
      resolve("scripts/check-modern-toolchain.mjs"),
      "utf8",
    );
    expect(modernToolchainScript).toContain("oxfmt");
    expect(modernToolchainScript).toContain("oxlint");
    expect(modernToolchainScript).toContain("@typescript/native-preview");
    expect(modernToolchainScript).toContain("node_modules/rolldown");
    expect(readFileSync(resolve("scripts/check-bundle-budget.mjs"), "utf8")).toContain(
      "appBundleBudgets",
    );
    expect(readFileSync(resolve("scripts/check-package-bundle-budget.mjs"), "utf8")).toContain(
      "packageBundleBudgets",
    );
    expect(readFileSync(resolve("scripts/package-extraction-map.mjs"), "utf8")).toContain(
      "expectedPackageRegistry",
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
    expect(readFileSync(resolve("scripts/check-package-registry-smoke.mjs"), "utf8")).toContain(
      "--current-version",
    );
    expect(registryMigrationScript).toContain("BESLISMODEL_REGISTRY_MIGRATION_VERSION");
    expect(registryMigrationScript).toContain("migratePackageJson");
    expect(registryMigrationScript).toContain("migrateTsconfig");
    expect(registryMigrationScript).toContain("removePackageAliasEntries");
    expect(registryMigrationScript).toContain("Re-run with --write");
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
      "@beslismodel/copd-care",
      "@beslismodel/core",
      "@beslismodel/cvrm-prevent",
      "@beslismodel/dm-care",
      "@beslismodel/testing",
      "@beslismodel/vue",
    ]);
    expect(packageExtractionMap.packages?.every((item) => item.publicExportSha256)).toBe(true);
    expect(packageExtractionMap.packages?.every((item) => item.sourceTreeSha256)).toBe(true);
    expect(packageExtractionMap.packages?.every((item) => item.sourceTreeFileCount > 0)).toBe(true);
    expect(packageExtractionMap.appOnlyExclusions).toEqual(
      expect.arrayContaining(["flows/", "public/", "src/views/admin/", "src/lib/log-sink.ts"]),
    );
    expect(clinicalCopyScript).toContain("../public/main.json");
    expect(clinicalCopyScript).toContain("visibleStringKeys");
    expect(clinicalCopyScript).toContain("blockedEnglishTerms");
    expect(clinicalCopyScript).toContain("metadata");
  });

  it("keeps Storybook and route-level runtime accessibility gates active", () => {
    expect(packageJson.devDependencies?.["@storybook/addon-a11y"]).toBeTruthy();
    expect(packageJson.devDependencies?.["axe-core"]).toBeTruthy();
    expect(packageJson.devDependencies?.["vitest-axe"]).toBeTruthy();
    expect(storybookMain).toContain("@storybook/addon-a11y");
    expect(storybookPreview).toContain("a11y:");
    expect(storybookPreview).toContain('test: "error"');
    expect(storybookPreview).toContain('"color-contrast"');
    expect(workflow).toContain("npm run build-storybook");
    expect(routeAccessibilityTest).toContain('describe("route accessibility smoke"');
    expect(routeAccessibilityTest).toContain('"landing route has no axe violations"');
    expect(routeAccessibilityTest).toContain('"questionnaire route has no axe violations"');
    expect(routeAccessibilityTest).toContain('"result route has no axe violations"');
    expect(routeAccessibilityTest).toContain(
      "direct result URL resolves data without leaving the shell loader visible",
    );
    expect(routeAccessibilityTest).toContain(
      "direct missing result URL renders an error instead of a persistent loader",
    );
    expect(routeAccessibilityTest).toContain("/info/uti.local.healthy.1");
    expect(routeAccessibilityTest).toContain('"error route has no axe violations"');
    expect(routeAccessibilityTest).toContain(
      'runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]',
    );
    expect(routeAccessibilityTest).toContain("questionnaire redirect preserves the source flow");
  });

  it("keeps framework package release policy explicit and lockstep", () => {
    const packages = [
      corePackage,
      compilerPackage,
      copdCarePackage,
      cvrmPreventPackage,
      dmCarePackage,
      testingPackage,
      vuePackage,
    ];
    const versions = new Set(packages.map((manifest) => manifest.version));

    expect(packages.map((manifest) => manifest.name).sort()).toEqual([
      "@beslismodel/compiler",
      "@beslismodel/copd-care",
      "@beslismodel/core",
      "@beslismodel/cvrm-prevent",
      "@beslismodel/dm-care",
      "@beslismodel/testing",
      "@beslismodel/vue",
    ]);
    expect(versions.size).toBe(1);
    const appFrameworkDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    for (const manifest of packages) {
      expect(appFrameworkDependencies[manifest.name]).toBe(manifest.version);
      const lockEntry = packageLock.packages?.[`node_modules/${manifest.name}`];
      const packageBasename = manifest.name.split("/")[1];
      expect(lockEntry?.version).toBe(manifest.version);
      expect(lockEntry?.resolved).toBe(
        `${expectedPackageRegistry}${encodeURIComponent(manifest.name)}/-/${manifest.version}/${packageBasename}-${manifest.version}.tgz`,
      );
    }
    expect(copdCarePackage.dependencies?.["@beslismodel/core"]).toBe(corePackage.version);
    expect(cvrmPreventPackage.dependencies?.["@beslismodel/core"]).toBe(corePackage.version);
    expect(dmCarePackage.dependencies?.["@beslismodel/core"]).toBe(corePackage.version);
    expect(testingPackage.dependencies?.["@beslismodel/core"]).toBe(corePackage.version);
    expect(vuePackage.dependencies?.["@beslismodel/core"]).toBe(corePackage.version);
    for (const manifest of packages) {
      expect(manifest.description).toBeTruthy();
      expect(manifest.license).toBe("GPL-3.0-only");
      expect(manifest.homepage).toBe(expectedPackageHomepage);
      expect(manifest.bugs?.url).toBe(expectedPackageBugsUrl);
      expect(manifest.repository?.type).toBe("git");
      expect(manifest.repository?.url).toBe(expectedPackageRepositoryUrl);
      expect(manifest.files).toEqual(["dist"]);
      expect(manifest.engines?.node).toBe(">=20.19.0");
      expect(manifest.publishConfig?.registry).toBe(expectedPackageRegistry);
      expect(manifest.scripts?.prepack).toContain("run build:");
    }
    expect(releaseStrategy).toContain("All seven packages use same version");
    expect(releaseStrategy).toContain("publishConfig.registry");
    expect(releaseStrategy).toContain("dist-tag `next`");
    expect(releaseStrategy).toContain("Registry Smoke");
    expect(releaseStrategy).toContain("file-tarball install smoke");
    expect(releaseStrategy).toContain("check:package-release-notes");
    expect(releaseStrategy).toContain("docs/gitea-package-publishing.md");
    expect(releaseStrategy).toContain("Rollback");
    expect(releaseStrategy).toContain("Node `20`, `22` and `24`");
    expect(releaseStrategy).toContain("`beslismodel-framework` exists as a sibling Gitea repo");
    expect(releaseStrategy).toContain("0.1.0-next.1");
    expect(releaseStrategy).toContain("BESLISMODEL_PUBLISH_CONFIRM=<exact-prerelease>");
    expect(releaseStrategy).toContain("BESLISMODEL_REGISTRY_SMOKE_VERSION=<exact-prerelease>");
    expect(releaseStrategy).toContain("check:modern-toolchain");
    expect(releaseStrategy).toContain("Project `.npmrc` may define the scope registry");
    expect(releaseStrategy).toContain("must not contain a token");
    expect(releaseStrategy).toContain("exact registry versions");
    expect(releaseStrategy).toContain("landing-grid regression");
    expect(releaseStrategy).toContain("Urinestrip end-to-end fixture");
    const giteaPackagePublishing = readFileSync(
      resolve("docs/gitea-package-publishing.md"),
      "utf8",
    );
    expect(giteaPackagePublishing).toContain("npm run migrate:registry-deps -- --write");
    expect(giteaPackagePublishing).toContain("BESLISMODEL_PUBLISH_CONFIRM=<exact-prerelease>");
    expect(giteaPackagePublishing).toContain(
      "BESLISMODEL_REGISTRY_SMOKE_VERSION=<exact-prerelease>",
    );
    expect(giteaPackagePublishing).toContain("0.1.0-next.1");
  });

  it("keeps root agent instructions aligned with current package architecture", () => {
    expect(agentInstructions).toContain("Vue 3 + Vite 8 SPA");
    expect(agentInstructions).toContain("@beslismodel/compiler");
    expect(agentInstructions).toContain("@beslismodel/core");
    expect(agentInstructions).toContain("@beslismodel/vue");
    expect(agentInstructions).toContain("@beslismodel/cvrm-prevent");
    expect(agentInstructions).toContain("@beslismodel/copd-care");
    expect(agentInstructions).toContain("@beslismodel/dm-care");
    expect(agentInstructions).toContain("@typescript/native-preview");
    expect(agentInstructions).toContain("tsgo");
    expect(agentInstructions).toContain("oxfmt");
    expect(agentInstructions).toContain("oxlint");
    expect(agentInstructions).toContain("Rolldown");
    expect(agentInstructions).toContain("@beslismodel/*@0.1.0");
    expect(agentInstructions).toContain("0.1.0-next.1");
    expect(agentInstructions).toContain("desktop landing grid");
    expect(agentInstructions).toContain("2 rijen x 3 kolommen");
    expect(agentInstructions).toContain("geen custom UI back button");
    expect(agentInstructions).toContain("docs/nas-handoff-2026-06-04.md");
    expect(agentInstructions).not.toContain("Vite 7");
    expect(agentInstructions).not.toContain("decision-engine-core");
    expect(agentInstructions).not.toContain("decision-engine-core-1.0.0.tgz");
    expect(agentInstructions).not.toContain("src/views/AboutPage.vue");
    expect(claudeInstructions).toContain("AGENTS.md");
    expect(claudeInstructions).toContain("Vue 3 + Vite 8");
    expect(claudeInstructions).toContain("@beslismodel/compiler");
    expect(claudeInstructions).toContain("src/lib/guidelines.ts");
    expect(claudeInstructions).toContain("@beslismodel/*@0.1.0");
    expect(claudeInstructions).toContain("0.1.0-next.1");
    expect(claudeInstructions).toContain("Desktop landing grid");
    expect(claudeInstructions).not.toContain("Vite 7");
    expect(claudeInstructions).not.toContain("decision-engine-core");
    expect(claudeInstructions).not.toContain("decision-engine-core-1.0.0.tgz");
    expect(claudeInstructions).not.toContain("src/views/AboutPage.vue");
  });

  it("keeps the latest code audit reconciled instead of reopening historical issues", () => {
    expect(latestCodeAudit).toContain("## Final Reconciliation -- 2026-06-01");
    expect(latestCodeAudit).toContain("## Current Reconciled Status");
    expect(latestCodeAudit).toContain("## Historical Context Summary");
    expect(latestCodeAudit).toContain("## Historical Scorecard");
    expect(latestCodeAudit).toContain("Original 2026-05-22 snapshot below is superseded");
    expect(latestCodeAudit).toContain("SPEC-UR01 t/m SPEC-UR11 reconciled");
    expect(latestCodeAudit).not.toContain("| 1 | Architecture | 4/5 | 4/5 | = | Tarball dep");
    expect(latestCodeAudit).not.toContain("still no clinical test infra |");
    expect(latestCodeAudit).not.toContain("pregnancy warning still missing (51 days)");
  });

  it("keeps active docs aligned with system-only theme and popover invariants", () => {
    expect(readme).toContain("answer-info popovers open without selecting answers");
    expect(readme).toContain("system theme is selected before first paint");
    expect(latestDesignAudit).toContain("System-only theme bootstrap");
    expect(latestDesignAudit).toContain("UI theme switch is bewust verwijderd");
    expect(nasHandoff).toContain("no UI theme switch is expected");
    expect(nasHandoff).toContain("answer-info popovers open/close without answer selection");
    expect(nasHandoff).toContain("Stable `0.1.0` is now the current");
    expect(nasHandoff).not.toContain("keeps stable `0.1.0` as the next");
  });

  it("keeps README aligned with current app and framework workflow", () => {
    expect(readme).toContain("Vue 3 + Vite 8 SPA");
    expect(readme).toContain("@beslismodel/compiler");
    expect(readme).toContain("@beslismodel/*@0.1.0");
    expect(readme).toContain("0.1.0-next.1");
    expect(readme).toContain("npm ci");
    expect(readme).toContain("http://localhost:5173");
    expect(readme).toContain("npm run check:app");
    expect(readme).toContain("npm run check:framework");
    expect(readme).toContain("npm run check:browser-smoke");
    expect(readme).toContain("npm run check:guidelines");
    expect(readme).toContain("src/lib/guidelines.ts");
    expect(readme).toContain("docs/nas-handoff-2026-06-04.md");
    expect(readme).toContain("AGENTS.md");
    expect(readme).not.toContain("http://localhost:3000");
    expect(readme).not.toContain("yarn install");
    expect(readme).not.toContain("pnpm install");
    expect(readme).not.toContain("No judgement");
    expect(readme).not.toContain("decision-engine-core");
  });

  it("keeps obsolete local compiler artifacts out of the repository", () => {
    expect(gitignore).toContain("*.tgz");
    expect(
      execFileSync("git", ["ls-files", "decision-engine-core-1.0.0.tgz"], {
        encoding: "utf8",
      }).trim(),
    ).toBe("");
    expect(
      execFileSync("git", ["ls-files", "scripts/flow-compiler.mjs"], {
        encoding: "utf8",
      }).trim(),
    ).toBe("");
    expect(
      execFileSync("git", ["ls-files", "scripts/flow-compiler.test.mjs"], {
        encoding: "utf8",
      }).trim(),
    ).toBe("");
  });

  it("keeps critical UI regression tests for landing, transitions and progress", () => {
    expect(landingTemplateTest).toContain("keeps the desktop landing grid at 2 rows by 3 columns");
    expect(landingTemplateTest).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(landingTemplateTest).toContain("keeps landing menu tiles dimensionally stable");
    expect(appCompatibilitySource).toContain("defineAsyncComponent");
    expect(appCompatibilitySource).toContain('strip: () => import("../components/StripSvg.vue")');
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
    expect(browserRegressionSmokeScript).toContain("Expected 2 desktop landing rows");
    expect(browserRegressionSmokeScript).toContain("Expected landing rows 3+2");
    expect(browserRegressionSmokeScript).toContain("assertThemeModes");
    expect(browserRegressionSmokeScript).toContain("Theme mode control should not render");
    expect(browserRegressionSmokeScript).toContain("System light data-theme mismatch");
    expect(themeStoreTest).toContain("reacts to OS theme changes");
    expect(themeStoreTest).toContain("creates a fallback theme-color meta when none exist");
    expect(themeInitTest).toContain("uses OS preference");
    expect(themeInitTest).toContain("uses existing meta colors when generated theme tokens");
    expect(browserRegressionSmokeScript).toContain("assertReducedMotionRouteTransitions");
    expect(browserRegressionSmokeScript).toContain("prefers-reduced-motion");
    expect(browserRegressionSmokeScript).toContain(
      "Reduced motion route transition used View Transitions",
    );
    expect(browserRegressionSmokeScript).toContain("Progress text should stay visually empty");
    expect(multiInputPanelTest).toContain(
      "keeps grouped progress indicative and free of misleading visible counts",
    );
    expect(multiInputPanelTest).toContain("Indicatieve voortgang door vragenlijst");
    expect(multiInputPanelTest).toContain("progress-bar-text");
    expect(browserRegressionSmokeScript).toContain("assertQuestionnaireDeepBackStack");
    expect(browserRegressionSmokeScript).toContain("questionnaire/bacteriurie");
    expect(browserRegressionSmokeScript).toContain("q_bac_tissue");
    expect(browserRegressionSmokeScript).toContain("q_bac_risk");
    expect(browserRegressionSmokeScript).toContain("q_bac_catheter");
    expect(browserRegressionSmokeScript).toContain("q_bac_tx_local_healthy");
    expect(browserRegressionSmokeScript).toContain("page.goBack");
    expect(browserRegressionSmokeScript).toContain("Answer option shell has unwanted border");
    expect(browserRegressionSmokeScript).toContain("assertInfoPopoverViewportFit");
    expect(browserRegressionSmokeScript).toContain("Info popover escaped mobile viewport");
    expect(browserRegressionSmokeScript).toContain("Info popover max-height ignores viewport");
    expect(browserRegressionSmokeScript).toContain("Direct result route stayed stuck on loader");
    expect(browserRegressionSmokeScript).toContain("Result checkbox visual has unwanted border");
    expect(browserRegressionSmokeScript).toContain("notice padding too tight");
    expect(browserRegressionSmokeScript).toContain("Info popover closed after clicking inside");
    expect(browserRegressionSmokeScript).toContain("Info popover did not receive focus");
    expect(browserRegressionSmokeScript).toContain("did not restore focus");
    expect(browserRegressionSmokeScript).toContain("Info popover stayed visible after keyboard");
    expect(browserRegressionSmokeScript).toContain("assertForcedColorsResultRoute");
    expect(browserRegressionSmokeScript).toContain("Emulation.setEmulatedMedia");
    expect(browserRegressionSmokeScript).toContain('name: "forced-colors", value: "active"');
    expect(browserRegressionSmokeScript).toContain(
      "Forced-colors media emulation did not activate",
    );
    expect(browserRegressionSmokeScript).toContain(
      "Forced-colors warning notice lacks visible border",
    );
  });

  it("keeps Gitea app workflows on baseline actions while package publishing stays npm-native", () => {
    expect(workflow).toContain("Configure Gitea npm auth");
    expect(workflow).toContain("NPM_REGISTRY_TOKEN");
    expect(workflow).toContain(
      "@beslismodel:registry https://git.oranje.wtf/api/packages/martien/npm/",
    );
    expect(workflow).toContain("@oranje:registry https://git.oranje.wtf/api/packages/martien/npm/");
    expect(workflow).toContain("@xenia:registry https://git.oranje.wtf/api/packages/martien/npm/");
    expect(workflow).toContain("//git.oranje.wtf/api/packages/martien/npm/:_authToken");
    expect(workflow).toContain(
      "npm view @beslismodel/core@0.1.0 version --registry=https://git.oranje.wtf/api/packages/martien/npm/",
    );

    expect(giteaCiWorkflow).toContain(
      "https://git.oranje.wtf/martien/baseline/actions/setup-npm-auth@v2.2.1",
    );
    expect(giteaCiWorkflow).toContain(
      "https://git.oranje.wtf/martien/baseline/actions/setup-node@v2.2.1",
    );
    expect(giteaCiWorkflow).toContain("registry: https://git.oranje.wtf/api/packages/martien/npm/");
    expect(giteaCiWorkflow).toContain('scopes: "@oranje,@xenia,@beslismodel"');
    expect(giteaCiWorkflow).toContain('preflight-package: "@beslismodel%2fcore"');
    expect(giteaCiWorkflow).not.toContain('preflight-package: "@oranje%2ftokens"');
    expect(giteaCiWorkflow).toContain("npm run check:app");
    expect(giteaCiWorkflow).toContain("npm run check:framework");
    expect(giteaCiWorkflow).toContain("npm run check:package-registry-smoke:current");
    expect(giteaCiWorkflow).toContain("browser-actions/setup-chrome@v1");
    expect(giteaCiWorkflow).toContain("npm run check:browser-smoke");
    expect(giteaCiWorkflow).toContain("npm run check:package-release-config");

    expect(giteaReleaseWorkflow).toContain(
      "https://git.oranje.wtf/martien/baseline/actions/release-pr@v2.2.1",
    );
    expect(giteaReleaseWorkflow).toContain(
      "https://git.oranje.wtf/martien/baseline/actions/upload-sourcemaps@v2.2.1",
    );
    expect(giteaReleaseWorkflow).toContain(
      "https://git.oranje.wtf/martien/baseline/actions/release-finalize@v2.2.1",
    );
    expect(giteaReleaseWorkflow).toContain("app-name: urinest.rip");
    expect(giteaReleaseWorkflow).toContain("release-version: ${{ needs.version.outputs.value }}");
    expect(giteaReleaseWorkflow).toContain('preflight-package: "@beslismodel%2fcore"');
    expect(giteaReleaseWorkflow).not.toContain('preflight-package: "@oranje%2ftokens"');
    expect(giteaReleaseWorkflow).toContain("npm run check:framework");
    expect(giteaReleaseWorkflow).toContain("npm run check:package-registry-smoke:current");
    expect(giteaReleaseWorkflow).toContain("browser-actions/setup-chrome@v1");
    expect(giteaReleaseWorkflow).toContain("npm run check:browser-smoke");
    expect(giteaReleaseWorkflow).toContain("nwtgck/actions-netlify@v3");
    expect(giteaReleaseWorkflow).not.toContain("npm publish");
  });
});
