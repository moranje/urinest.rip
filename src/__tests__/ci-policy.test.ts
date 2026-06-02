import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(resolve(".github/workflows/ci.yml"), "utf8");
const releaseStrategy = readFileSync(resolve("docs/package-release-strategy.md"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as {
  scripts: Record<string, string>;
  engines?: Record<string, string>;
};
const corePackage = JSON.parse(readFileSync(resolve("packages/core/package.json"), "utf8")) as {
  name: string;
  version: string;
  description?: string;
  license?: string;
  files?: string[];
  dependencies?: Record<string, string>;
  engines?: Record<string, string>;
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
  scripts?: Record<string, string>;
};

describe("CI policy", () => {
  it("keeps dependency audit, secret scanning, package and bundle gates active", () => {
    expect(workflow).toContain("npm audit --omit=dev --audit-level=high");
    expect(workflow).toContain("Possible hardcoded JWT/key found in source code");
    expect(workflow).toContain("git ls-files --error-unmatch .env");
    expect(workflow).toContain("npm run check:packages");
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
    expect(packageJson.scripts.budget).toContain("budget:app");
    expect(packageJson.scripts.budget).toContain("budget:packages");
    expect(packageJson.scripts["budget:packages"]).toBe(
      "node scripts/check-package-bundle-budget.mjs",
    );
  });

  it("keeps framework package release policy explicit and lockstep", () => {
    const packages = [corePackage, compilerPackage, testingPackage, vuePackage];
    const versions = new Set(packages.map((manifest) => manifest.version));

    expect(packages.map((manifest) => manifest.name).sort()).toEqual([
      "@beslismodel/compiler",
      "@beslismodel/core",
      "@beslismodel/testing",
      "@beslismodel/vue",
    ]);
    expect(versions.size).toBe(1);
    expect(testingPackage.dependencies?.["@beslismodel/core"]).toBe(corePackage.version);
    expect(vuePackage.dependencies?.["@beslismodel/core"]).toBe(corePackage.version);
    for (const manifest of packages) {
      expect(manifest.description).toBeTruthy();
      expect(manifest.license).toBe("GPL-3.0-only");
      expect(manifest.files).toEqual(["dist"]);
      expect(manifest.engines?.node).toBe(">=20.19.0");
      expect(manifest.scripts?.prepack).toContain("run build:");
    }
    expect(releaseStrategy).toContain("All four packages use same version");
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
});
