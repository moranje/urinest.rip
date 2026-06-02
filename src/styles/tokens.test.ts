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
    const checkedFiles = files.filter((file) => !file.endsWith("src/styles/tokens.test.ts"));
    const offenders = checkedFiles.filter((file) => colorLiteral.test(read(file)));

    expect(offenders).toEqual([]);
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

  it("keeps landing tiles bounded by component scale with a 2-row desktop layout", () => {
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

  it("keeps the dev flow compiler from dropping landing taxonomy", () => {
    const flowCompiler = read("scripts/flow-compiler.mjs");

    expect(flowCompiler).toContain('icon: { type: "string" }');
    expect(flowCompiler).toContain("metadata: {");
    expect(flowCompiler).toContain("additionalProperties");
    expect(flowCompiler).toContain("landingDescription");
    expect(flowCompiler).toContain("landingSection");
    expect(flowCompiler).toContain("icon: flow.icon");
    expect(flowCompiler).toContain("metadata: flow.metadata");
  });

  it("keeps questionnaire route switches inside the same component instance", () => {
    const app = read("src/App.vue");

    expect(app).toContain("routeViewKey(r)");
    expect(app).toContain('viewRoute.name === "Questionnaire"');
    expect(app).not.toContain(':key="r.fullPath"');
  });
});
