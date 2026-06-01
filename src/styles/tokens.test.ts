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

  it("keeps landing tiles bounded by component scale", () => {
    const landingPage = read("src/views/LandingPage.vue");

    expect(landingPage).not.toContain("28vw");
    expect(landingPage).toContain("--landing-tile-size: clamp(16rem, 18vw, 20rem)");
    expect(landingPage).toContain("max-inline-size: var(--landing-tile-size)");
  });
});
