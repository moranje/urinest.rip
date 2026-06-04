import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_COLORS } from "../../styles/themeColors";

const source = readFileSync(resolve("public/theme-init.js"), "utf8");

type ThemeWindow = Window &
  typeof globalThis & {
    __BESLISMODEL_THEME_TOKENS__?: {
      themeColor?: Partial<Record<"dark" | "light", string>>;
    };
  };

function installMatchMedia(prefersDark: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: prefersDark })),
  });
}

function setThemeMetas(colors = THEME_COLORS): void {
  document.head.innerHTML = `
    <meta name="theme-color" content="${colors.light}" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="${colors.dark}" media="(prefers-color-scheme: dark)" />
  `;
}

function runThemeInit(): void {
  runInNewContext(source, {
    document,
    window,
  });
}

function themeMetaContents(): string[] {
  return Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')).map(
    (meta) => meta.getAttribute("content") ?? "",
  );
}

describe("theme-init", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setThemeMetas();
    installMatchMedia(false);
    document.documentElement.removeAttribute("data-theme");
    (window as ThemeWindow).__BESLISMODEL_THEME_TOKENS__ = {
      themeColor: THEME_COLORS,
    };
  });

  it.each([
    [false, "light"],
    [true, "dark"],
  ] as const)("uses OS preference %s before Vue can hydrate", (prefersDark, expectedTheme) => {
    installMatchMedia(prefersDark);

    runThemeInit();

    expect(document.documentElement.getAttribute("data-theme")).toBe(expectedTheme);
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
  });

  it("falls back to light when matchMedia is unavailable", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: undefined,
    });

    runThemeInit();

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
  });

  it("uses existing meta colors when generated theme tokens are unavailable", () => {
    const fallback = {
      dark: ["#", "102030"].join(""),
      light: ["#", "f4f4f4"].join(""),
    };
    setThemeMetas(fallback);
    delete (window as ThemeWindow).__BESLISMODEL_THEME_TOKENS__;
    installMatchMedia(true);

    runThemeInit();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(themeMetaContents()).toEqual([fallback.light, fallback.dark]);
  });
});
