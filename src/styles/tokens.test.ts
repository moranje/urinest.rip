/* eslint-disable security/detect-non-literal-fs-filename */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const colorLiteral = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/;

function read(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function readJson<T>(path: string): T {
  return JSON.parse(read(path)) as T;
}

function readCompilerBundle(): string {
  const distPath = resolve(repoRoot, "node_modules/@beslismodel/compiler/dist");
  const bundleName = readdirSync(distPath).find((entry) => /^compiler-.*\.js$/u.test(entry));
  if (!bundleName) throw new Error("Could not locate installed @beslismodel/compiler bundle");
  return readFileSync(resolve(distPath, bundleName), "utf8");
}

function walk(dir: string): string[] {
  return readdirSync(resolve(repoRoot, dir)).flatMap((entry) => {
    const absolute = resolve(repoRoot, dir, entry);
    const path = relative(repoRoot, absolute);
    if (statSync(absolute).isDirectory()) return walk(path);
    return path;
  });
}

describe("design tokens", () => {
  it("keeps color roles in the central token file", () => {
    const mainCss = read("src/styles/main.css");
    const tokensCss = read("src/styles/tokens.css");
    const semanticLayer = tokensCss.split("@supports")[0];
    const declarations = [...semanticLayer.matchAll(/(--md-sys-color-[\w-]+)\s*:\s*([^;]+);/g)].map(
      (match) => [match[1], match[2]] as const,
    );

    expect(mainCss).not.toContain("themes.css");
    expect(existsSync(resolve(repoRoot, "src/styles/themes.css"))).toBe(false);
    expect(tokensCss).toContain('[data-theme="light"]');
    expect(tokensCss).toContain("color-scheme: light");
    expect(tokensCss).toContain('[data-theme="dark"]');
    expect(tokensCss).toContain("color-scheme: dark");
    expect(declarations.length).toBeGreaterThanOrEqual(25);

    for (const [name, value] of declarations) {
      expect(value, `${name} must resolve via light-dark()`).toContain("light-dark(");
      expect(value, `${name} must be composed from reference tokens`).not.toMatch(colorLiteral);
    }
  });

  it("keeps component color literals out of UI styles", () => {
    const files = [
      ...walk("src/components"),
      ...walk("src/views"),
      ...walk("src/styles"),
      ...walk(".storybook"),
    ].filter((file) => !file.endsWith("src/styles/tokens.css"));
    const checkedFiles = files.filter(
      (file) =>
        !file.endsWith("src/styles/tokens.test.ts") &&
        !file.endsWith("src/styles/beslismodel.tokens.json"),
    );
    const offenders = checkedFiles.filter((file) => colorLiteral.test(read(file)));

    expect(offenders).toEqual([]);
  });

  it("keeps the generated DTCG export and theme bootstrap metadata in sync", () => {
    type ThemeMode = "dark" | "light";
    type TokenExport = {
      $extensions: {
        "wtf.oranje.beslismodel": {
          generatedBy: string;
          skippedCssVariables: string[];
          source: string;
          specification: string;
          theme: {
            backgroundColor: Record<ThemeMode, string>;
            themeColor: Record<ThemeMode, string>;
          };
        };
      };
      md: {
        ref: {
          palette: {
            clinical: { green: Record<string, { $value: { hex: string } }> };
          };
        };
        sys: {
          color: {
            background: Record<ThemeMode, { $value: string }>;
            primary: {
              container: Record<ThemeMode, { $value: string }>;
            } & Record<ThemeMode, { $value: string }>;
          };
        };
      };
    };
    type TokenDistributionManifest = {
      generatedBy: string;
      governance: { parityChecks: string[] };
      source: {
        css: string;
        dtcg: string;
        themeBootstrap: string;
      };
      targets: { id: string; status: string }[];
    };

    const tokenExport = readJson<TokenExport>("src/styles/beslismodel.tokens.json");
    const tokenDistribution = readJson<TokenDistributionManifest>(
      "docs/design-token-distribution.json",
    );
    const tokenDistributionDoc = read("docs/design-token-distribution.md");
    const extension = tokenExport.$extensions["wtf.oranje.beslismodel"];
    const themeScript = read("public/theme-tokens.js");
    const themeInit = read("public/theme-init.js");
    const index = read("index.html");
    const themeColors = read("src/styles/themeColors.ts");
    const themeStore = read("src/store/themeStore.ts");
    const viteConfig = read("vite.config.js");

    expect(extension.generatedBy).toBe("scripts/check-design-tokens.mjs");
    expect(extension.source).toBe("src/styles/tokens.css");
    expect(extension.specification).toBe("https://www.designtokens.org/TR/2025.10/format/");
    expect(extension.skippedCssVariables).not.toContain("--md-sys-color-primary");
    expect(extension.skippedCssVariables).not.toContain("--md-ref-palette-clinical-green-40");
    expect(tokenExport.md.ref.palette.clinical.green["40"].$value.hex).toBe("#16a34a");
    expect(tokenExport.md.ref.palette.clinical.green["30"].$value.hex).toBe("#005a2b");
    expect(tokenExport.md.sys.color.primary.light.$value).toBe(
      "{md.ref.palette.clinical.green.40}",
    );
    expect(tokenExport.md.sys.color.primary.container.dark.$value).toBe(
      "{md.ref.palette.clinical.green.30}",
    );
    expect(extension.theme).toEqual({
      backgroundColor: { dark: "#1a1c1e", light: "#fcfcff" },
      themeColor: { dark: "#005a2b", light: "#16a34a" },
    });
    expect(tokenDistribution.generatedBy).toBe("scripts/check-design-token-distribution.mjs");
    expect(tokenDistribution.source).toEqual({
      css: "src/styles/tokens.css",
      dtcg: "src/styles/beslismodel.tokens.json",
      themeBootstrap: "public/theme-tokens.js",
    });
    expect(tokenDistribution.targets.map((target) => `${target.id}:${target.status}`)).toEqual([
      "style-dictionary-v4:ready",
      "tokens-studio-figma:ready",
      "web-runtime-css:ready",
      "theme-bootstrap:ready",
    ]);
    expect(tokenDistribution.governance.parityChecks).toContain("npm run check:design-tokens");
    expect(tokenDistribution.governance.parityChecks).toContain(
      "npm run check:design-token-distribution",
    );
    expect(tokenDistributionDoc).toContain("npm run tokens:distribution:write");
    expect(tokenDistributionDoc).toContain("tokens-studio-figma");
    expect(themeScript).toContain("window.__BESLISMODEL_THEME_TOKENS__");
    expect(themeScript).toContain('light: "#16a34a"');
    expect(themeScript).toContain('dark: "#005a2b"');
    expect(themeInit).toContain("window.__BESLISMODEL_THEME_TOKENS__");
    expect(themeInit).not.toContain("#16a34a");
    expect(themeInit).not.toContain("#005a2b");
    expect(index).toContain('src="/theme-tokens.js"');
    expect(index.indexOf('src="/theme-tokens.js"')).toBeLessThan(
      index.indexOf('src="/theme-init.js"'),
    );
    expect(themeColors).toContain("beslismodel.tokens.json");
    expect(themeStore).toContain('from "../styles/themeColors"');
    expect(viteConfig).toContain("themeTokens.themeColor.light");
    expect(viteConfig).toContain("themeTokens.backgroundColor.light");
  });

  it("keeps legacy md component classes out of runtime UI", () => {
    const files = [...walk("src/components"), ...walk("src/views"), ...walk("src/styles")].filter(
      (file) => !file.endsWith("src/styles/tokens.test.ts"),
    );
    const legacyClass = /\bmd-(button|card|tile|checkbox)\b/;
    const offenders = files.filter((file) => legacyClass.test(read(file)));

    expect(read("src/styles/main.css")).not.toContain("components.css");
    expect(existsSync(resolve(repoRoot, "src/styles/components.css"))).toBe(false);
    expect(offenders).toEqual([]);
  });

  it("keeps runtime transitions explicit", () => {
    const files = [...walk("src/components"), ...walk("src/views"), ...walk("src/styles")].filter(
      (file) => !file.endsWith("src/styles/tokens.test.ts"),
    );
    const broadTransition = /transition(?:-property)?:\s*all\b/;
    const offenders = files.filter((file) => broadTransition.test(read(file)));

    expect(offenders).toEqual([]);
  });

  it("keeps shared motion in motion utilities", () => {
    const mainCss = read("src/styles/main.css");
    const motionCss = read("src/styles/motion.css");
    const badge = read("src/components/primitives/Badge.vue");
    const button = read("src/components/primitives/Button.vue");
    const icon = read("src/components/primitives/Icon.vue");
    const resultTemplate = read("src/components/templates/ResultTemplate.vue");
    const skeleton = read("src/components/primitives/Skeleton.vue");

    expect(mainCss).toContain('@import "./motion.css" layer(utilities)');
    expect(motionCss).toContain(".motion-spin");
    expect(motionCss).toContain(".motion-shimmer-sweep::after");
    expect(motionCss).toContain(".motion-pulse-emphasis");
    expect(motionCss).toContain("@keyframes motion-enter-up");
    expect(motionCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(badge).toContain("motion-pulse-emphasis");
    expect(button).toContain("btn-spinner motion-spin");
    expect(icon).toContain("'motion-spin': spin");
    expect(resultTemplate).toContain("animation: motion-enter-up");
    expect(skeleton).toContain("skeleton motion-shimmer-sweep");
    expect(badge).not.toContain("@keyframes badge-pulse");
    expect(button).not.toContain("@keyframes btn-spin");
    expect(icon).not.toContain("@keyframes icon-spin");
    expect(resultTemplate).not.toContain("@keyframes result-template-enter");
    expect(mainCss).not.toContain("@keyframes spin");
  });

  it("keeps landing tiles bounded by component scale with a 2 rows by 3 columns desktop layout", () => {
    const landingTemplate = read("src/components/templates/LandingTemplate.vue");
    const primaryGridCss =
      landingTemplate.match(/:deep\(\.bm-landing-menu-grid__primary\)\s*\{(?<body>[\s\S]*?)\n\}/)
        ?.groups?.body ?? "";
    const compactCss =
      landingTemplate.match(/@container landing \(max-width: 44rem\)\s*\{(?<body>[\s\S]*?)\n\}/)
        ?.groups?.body ?? "";

    expect(landingTemplate).not.toContain("28vw");
    expect(landingTemplate).not.toContain("@container landing (max-width: 56.25rem)");
    expect(landingTemplate).not.toContain("--spacing-2xl");
    expect(landingTemplate).toContain("bm-landing-menu-grid__primary");
    expect(landingTemplate).toContain("--landing-tile-size: clamp(16rem, 18vw, 20rem)");
    expect(primaryGridCss).toContain("five primary flows render as 2 rows x 3 columns");
    expect(primaryGridCss).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(landingTemplate).toContain("@container landing (max-width: 44rem)");
    expect(compactCss).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(landingTemplate).toContain("max-inline-size: var(--landing-tile-size)");
  });

  it("keeps landing template CSS variables resolvable", () => {
    const tokensCss = read("src/styles/tokens.css");
    const landingTemplate = read("src/components/templates/LandingTemplate.vue");
    const tokenNames = new Set(
      [...tokensCss.matchAll(/(?<name>--[\w-]+)\s*:/g)].map((match) => match.groups?.name),
    );
    const localNames = new Set(
      [...landingTemplate.matchAll(/(?<name>--[\w-]+)\s*:/g)].map((match) => match.groups?.name),
    );
    const referencedNames = [
      ...new Set(
        [...landingTemplate.matchAll(/var\((?<name>--[\w-]+)/g)].map((match) => match.groups?.name),
      ),
    ];
    const unresolved = referencedNames.filter(
      (name) => !tokenNames.has(name) && !localNames.has(name),
    );

    expect(unresolved).toEqual([]);
  });

  it("keeps landing routes driven by manifest taxonomy", () => {
    const landingPage = read("src/views/LandingPage.vue");
    const landingTemplate = read("src/components/templates/LandingTemplate.vue");

    expect(landingPage).toContain("LandingTemplate");
    expect(landingPage).toContain("questionnaireStore.questionnaireList");
    expect(landingPage).toContain(':icon-keys="landingIconKeys"');
    expect(landingTemplate).toContain("LandingMenuGrid");
    expect(landingTemplate).toContain(':items="items"');
    expect(landingPage).not.toContain('to="/questionnaire/strip"');
    expect(landingPage).not.toContain('to="/questionnaire/bacteriurie"');
  });

  it("keeps the app build on the public compiler package without dropping landing taxonomy", () => {
    const viteConfig = read("vite.config.js");
    const buildFlowsScript = read("scripts/build-flows.mjs");
    const compilerPackage = read("node_modules/@beslismodel/compiler/package.json");
    const compilerTypes = read("node_modules/@beslismodel/compiler/dist/schema.d.ts");
    const compilerBundle = readCompilerBundle();

    expect(viteConfig).toContain('from "@beslismodel/compiler"');
    expect(viteConfig).not.toContain("./scripts/flow-compiler.mjs");
    expect(buildFlowsScript).toContain('from "@beslismodel/compiler"');
    expect(buildFlowsScript).not.toContain("./flow-compiler.mjs");
    expect(compilerPackage).toContain('"name": "@beslismodel/compiler"');
    expect(compilerPackage).toContain('"exports"');
    expect(compilerTypes).toContain("readonly icon");
    expect(compilerTypes).toContain("readonly metadata");
    expect(compilerTypes).toContain("readonly landingDescription");
    expect(compilerTypes).toContain("readonly landingSection");
    expect(compilerBundle).toContain('icon: { type: "string" }');
    expect(compilerBundle).toContain("metadata: {");
    expect(compilerBundle).toContain("additionalProperties");
    expect(compilerBundle).toContain("landingDescription");
    expect(compilerBundle).toContain("landingSection");
    expect(compilerBundle).toContain("icon: e.icon");
    expect(compilerBundle).toContain("metadata: e.metadata");
  });

  it("keeps questionnaire route switches inside the same component instance", () => {
    const app = read("src/App.vue");
    const appShell = read("src/composables/useAppShell.ts");

    expect(app).toContain("routeViewKey(r)");
    expect(appShell).toContain('viewRoute.name === "Questionnaire"');
    expect(app).not.toContain(':key="r.fullPath"');
  });
});
