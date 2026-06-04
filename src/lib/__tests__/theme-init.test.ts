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

function installStorage(value: string | null, options: { throwOnRead?: boolean } = {}): void {
  const storage = {
    getItem: vi.fn(() => {
      if (options.throwOnRead) {
        throw new Error("blocked local storage");
      }
      return value;
    }),
  } as unknown as Storage;

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  vi.stubGlobal("localStorage", storage);
}

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
    localStorage: window.localStorage,
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
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    setThemeMetas();
    installStorage(null);
    installMatchMedia(false);
    document.documentElement.removeAttribute("data-theme");
    (window as ThemeWindow).__BESLISMODEL_THEME_TOKENS__ = {
      themeColor: THEME_COLORS,
    };
  });

  it("applies stored light before Vue can hydrate, even when OS prefers dark", () => {
    installStorage("light");
    installMatchMedia(true);

    runThemeInit();

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.light]);
  });

  it("applies stored dark before Vue can hydrate, even when OS prefers light", () => {
    installStorage("dark");
    installMatchMedia(false);

    runThemeInit();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(themeMetaContents()).toEqual([THEME_COLORS.dark, THEME_COLORS.dark]);
  });

  it("treats stored system as OS-controlled with per-media theme colors", () => {
    installStorage("system");
    installMatchMedia(true);

    runThemeInit();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
  });

  it.each([
    [false, "light"],
    [true, "dark"],
  ] as const)("uses OS preference %s when storage is empty", (prefersDark, expectedTheme) => {
    installStorage(null);
    installMatchMedia(prefersDark);

    runThemeInit();

    expect(document.documentElement.getAttribute("data-theme")).toBe(expectedTheme);
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
  });

  it("falls back to OS preference when stored value is invalid", () => {
    installStorage("sepia");
    installMatchMedia(true);

    runThemeInit();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
  });

  it("falls back to OS preference when localStorage read throws", () => {
    installStorage(null, { throwOnRead: true });
    installMatchMedia(false);

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
    installStorage("dark");
    installMatchMedia(false);

    runThemeInit();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(themeMetaContents()).toEqual([fallback.dark, fallback.dark]);
  });
});
