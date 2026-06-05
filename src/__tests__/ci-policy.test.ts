/* eslint-disable security/detect-non-literal-fs-filename */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string): string {
  return readFileSync(resolve(path), "utf8");
}

function readJson<T>(path: string): T {
  return JSON.parse(read(path)) as T;
}

const workflow = read(".github/workflows/ci.yml");
const giteaCiWorkflow = read(".gitea/workflows/ci.yaml");
const giteaReleaseWorkflow = read(".gitea/workflows/release.yaml");
const readme = read("README.md");
const agentInstructions = read("AGENTS.md");
const claudeInstructions = read("CLAUDE.md");
const envExample = read(".env.example");
const appConfigSource = read("src/config/app-config.ts");
const appCompatibilitySource = read("src/lib/app-compatibility.ts");
const telemetryDocs = read("docs/telemetry.md");
const lighthouseConfig = read("lighthouserc.cjs");
const storybookMain = read(".storybook/main.ts");
const storybookPreview = read(".storybook/preview.ts");
const landingTemplateTest = read("src/components/templates/LandingTemplate.test.ts");
const routeAccessibilityTest = read("src/__tests__/accessibility-route.test.ts");
const routeTransitionPolicyTest = read("src/router/view-transition-policy.test.ts");
const viewTransitionTest = read("src/lib/view-transition.test.ts");
const tokenPolicyTest = read("src/styles/tokens.test.ts");
const themeStoreTest = read("src/store/themeStore.test.ts");
const themeInitTest = read("src/lib/__tests__/theme-init.test.ts");
const routeVisualContractTest = read("src/__tests__/route-visual-contract.test.ts");
const browserRegressionSmokeScript = read("scripts/check-browser-regression-smoke.mjs");
const consumerImportScript = read("scripts/check-consumer-package-imports.mjs");
const packageJson = readJson<{
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  scripts: Record<string, string>;
}>("package.json");
const packageLock = readJson<{
  packages?: Record<string, { resolved?: string; version?: string }>;
}>("package-lock.json");
const legacyScope = "@beslis" + "model";
const legacyPackage = (name: string): string => `${legacyScope}/${name}`;

describe("CI policy", () => {
  it("runs GitHub CI on Node 24 with GitHub Packages auth and no Gitea dependency", () => {
    expect(workflow).toContain("name: CI (Node 24)");
    expect(workflow).toContain("actions/checkout@v6");
    expect(workflow).toContain("actions/setup-node@v6");
    expect(workflow).toContain("node-version: 24");
    expect(workflow).not.toContain("matrix:");
    expect(workflow).not.toContain("node-version: [20, 22, 24]");
    expect(packageJson.engines?.node).toBe(">=24.0.0");
    expect(workflow).toContain("packages: read");
    expect(workflow).toContain('registry-url: "https://npm.pkg.github.com"');
    expect(workflow).toContain('scope: "@moranje"');
    expect(workflow).toContain("NODE_AUTH_TOKEN: ${{ secrets.GITHUB_PACKAGES_TOKEN }}");
    expect(workflow).not.toContain("NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}");
    expect(workflow).not.toContain("NPM_REGISTRY_TOKEN");
    expect(workflow).not.toContain("git.oranje.wtf/api/packages");
    for (const currentWorkflow of [giteaCiWorkflow, giteaReleaseWorkflow]) {
      expect(currentWorkflow).toContain("Configure GitHub Packages npm auth");
      expect(currentWorkflow).toContain("npm-token: ${{ secrets.GITHUB_PACKAGES_TOKEN }}");
      expect(currentWorkflow).toContain("registry: https://npm.pkg.github.com");
      expect(currentWorkflow).toContain('scopes: "@moranje"');
      expect(currentWorkflow).toContain('preflight-package: "@moranje%2fbeslismodel"');
      expect(currentWorkflow).toContain("npm run check:framework");
      expect(currentWorkflow).not.toContain("check:package-registry-smoke:current");
      expect(currentWorkflow).not.toContain("check:package-release-config");
      expect(currentWorkflow).not.toContain("@beslismodel%2fcore");
      expect(currentWorkflow).not.toContain("git.oranje.wtf/api/packages/martien/npm");
    }
    expect(workflow).toContain("npm audit --omit=dev --audit-level=high");
    expect(workflow).toContain("Possible hardcoded JWT/key found in source code");
    expect(workflow).toContain("git ls-files --error-unmatch .env");
    expect(workflow).toContain("npm run check:framework");
    expect(workflow).toContain("npm run build-storybook");
    expect(workflow).toContain("npm run check:browser-smoke");
    expect(workflow).toContain("npm run check:lighthouse:only");
    expect(workflow).toContain("npm run check:guidelines");
    expect(workflow).toContain("npm run budget");
  });

  it("keeps the app as an external @moranje/beslismodel consumer", () => {
    expect(packageJson.dependencies?.["@moranje/beslismodel"]).toBe("0.1.1");
    expect(Object.keys(packageJson.dependencies ?? {})).not.toEqual(
      expect.arrayContaining([legacyPackage("core"), legacyPackage("vue")]),
    );
    expect(Object.keys(packageJson.devDependencies ?? {})).not.toEqual(
      expect.arrayContaining([
        legacyPackage("compiler"),
        legacyPackage("copd-care"),
        legacyPackage("cvrm-prevent"),
        legacyPackage("dm-care"),
        legacyPackage("testing"),
      ]),
    );
    expect(packageLock.packages?.["node_modules/@moranje/beslismodel"]?.version).toBe("0.1.1");
    expect(packageLock.packages?.["node_modules/@moranje/beslismodel"]?.resolved).toContain(
      "npm.pkg.github.com",
    );
    expect(
      Object.keys(packageLock.packages ?? {}).some((key) => key.includes(`${legacyScope}/`)),
    ).toBe(false);
    expect(consumerImportScript).toContain("public @moranje/beslismodel/* exports");
    expect(consumerImportScript).toContain("@beslismodel");
  });

  it("keeps local package source and package-only gates out of the app repo", () => {
    expect(
      execFileSync("git", ["ls-files", "packages"], {
        encoding: "utf8",
      }).trim(),
    ).toBe("");
    expect(
      execFileSync("git", ["ls-files", "vitest.config.packages.ts"], {
        encoding: "utf8",
      }).trim(),
    ).toBe("");
    expect(packageJson.scripts["check:framework"]).toContain("check:consumer:urinestrip:only");
    expect(packageJson.scripts["check:framework"]).toContain("test:consumer:urinestrip:only");
    expect(packageJson.scripts["check:framework"]).toContain("check:consumer-imports");
    expect(packageJson.scripts["check:app"]).toContain("test:consumer:urinestrip:only");
    const checkAppSteps = packageJson.scripts["check:app"].split(" && ");
    expect(checkAppSteps.indexOf("npm run build")).toBeLessThan(
      checkAppSteps.indexOf("npm run budget:app"),
    );
    expect(packageJson.scripts["format"]).toBe("oxfmt --write src/ fixtures/");
    expect(packageJson.scripts["format:check"]).toBe("oxfmt --check src/ fixtures/");
    expect(packageJson.scripts["lint"]).toBe("oxlint src/ fixtures/ --deny-warnings");
    expect(packageJson.scripts["lint:all"]).toContain("eslint src/ fixtures/");
    expect(Object.keys(packageJson.scripts)).not.toEqual(
      expect.arrayContaining(["build:packages", "test:packages", "check:packages"]),
    );
  });

  it("keeps docs aligned with current package and theme architecture", () => {
    expect(readme).toContain("@moranje/beslismodel@0.1.1");
    expect(readme).toContain("moranje/beslismodel-framework");
    expect(readme).not.toContain(`${legacyScope}/*@0.1.0`);
    expect(agentInstructions).toContain("@moranje/beslismodel/compiler");
    expect(agentInstructions).toContain("@moranje/beslismodel@0.1.1");
    expect(agentInstructions).not.toContain(`${legacyScope}:registry`);
    expect(claudeInstructions).toContain("@moranje/beslismodel@0.1.1");
    expect(claudeInstructions).toContain("Theme is system-only");
    expect(envExample).toContain("VITE_TELEMETRY_SOURCE=urinestrip");
    expect(envExample).toContain("VITE_ENABLE_LOG_PERSISTENCE=false");
    expect(appConfigSource).toContain("VITE_TELEMETRY_SOURCE");
    expect(telemetryDocs).toContain("VITE_ENABLE_LOG_PERSISTENCE");
  });

  it("keeps Storybook, accessibility and browser regression gates active", () => {
    expect(storybookMain).toContain("@storybook/addon-a11y");
    expect(storybookPreview).toContain("../src/styles/main.css");
    expect(storybookPreview).not.toContain("globalTypes");
    expect(storybookPreview).not.toContain("Light/dark theme toggle");
    expect(storybookPreview).not.toContain("context.globals.theme");
    expect(routeAccessibilityTest).toContain('import axe from "axe-core"');
    expect(routeAccessibilityTest).toContain("axe.run");
    expect(routeAccessibilityTest).toContain("wcag22aa");
    expect(lighthouseConfig).toContain("categories:accessibility");
    expect(lighthouseConfig).toContain("categories:best-practices");
    expect(lighthouseConfig).toContain("categories:performance");

    expect(landingTemplateTest).toContain("keeps the desktop landing grid at 2 rows by 3 columns");
    expect(landingTemplateTest).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(tokenPolicyTest).toContain("five primary flows render as 2 rows x 3 columns");
    expect(routeTransitionPolicyTest).toContain("keeps questionnaire redirects out");
    expect(routeTransitionPolicyTest).toContain("keeps result navigation out");
    expect(viewTransitionTest).toContain("classifies skipped transitions as benign");
    expect(routeVisualContractTest).toContain("keeps landing route at desktop 2 rows by 3 columns");
    expect(browserRegressionSmokeScript).toContain("Expected 2 desktop landing rows");
    expect(browserRegressionSmokeScript).toContain("Expected landing rows 3+2");
    expect(browserRegressionSmokeScript).toContain("Theme mode control should not render");
    expect(browserRegressionSmokeScript).toContain("Progress text should stay visually empty");
    expect(browserRegressionSmokeScript).toContain("page.goBack");
    expect(browserRegressionSmokeScript).toContain("Direct result route stayed stuck on loader");
    expect(browserRegressionSmokeScript).toContain("Answer option shell has unwanted border");
    expect(browserRegressionSmokeScript).toContain("Result checkbox visual has unwanted border");
    expect(browserRegressionSmokeScript).toContain("notice padding too tight");
    expect(browserRegressionSmokeScript).toContain("Info popover escaped mobile viewport");
    expect(themeStoreTest).toContain("reacts to OS theme changes");
    expect(themeInitTest).toContain("uses OS preference");
  });

  it("keeps route compatibility and public framework imports explicit", () => {
    expect(appCompatibilitySource).toContain("defineAsyncComponent");
    expect(appCompatibilitySource).toContain('strip: () => import("../components/StripSvg.vue")');
    expect(read("vite.config.js")).toContain('from "@moranje/beslismodel/compiler"');
    expect(read("scripts/build-flows.mjs")).toContain('from "@moranje/beslismodel/compiler"');
    expect(read("fixtures/urinestrip-consumer/src/consumer-store.ts")).toContain(
      'from "@moranje/beslismodel/core"',
    );
    expect(read("fixtures/urinestrip-consumer/src/urinestrip.consumer.test.ts")).toContain(
      'from "@moranje/beslismodel/vue"',
    );
  });
});
