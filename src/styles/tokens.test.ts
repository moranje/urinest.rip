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

  it("keeps landing tiles bounded by component scale with a 2x3 desktop layout", () => {
    const landingTemplate = read("src/components/templates/LandingTemplate.vue");

    expect(landingTemplate).not.toContain("28vw");
    expect(landingTemplate).not.toContain("@container landing (max-width: 56.25rem)");
    expect(landingTemplate).toContain("bm-landing-menu-grid__primary");
    expect(landingTemplate).toContain("--landing-tile-size: clamp(16rem, 18vw, 20rem)");
    expect(landingTemplate).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(landingTemplate).toContain("@container landing (max-width: 44rem)");
    expect(landingTemplate).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(landingTemplate).toContain("max-inline-size: var(--landing-tile-size)");
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
    expect(flowCompiler).toContain('metadata: { type: "object" }');
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
