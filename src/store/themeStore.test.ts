import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useThemeStore } from "./themeStore";
import { handleError } from "../lib/errors";
import { THEME_COLORS } from "../styles/themeColors";

vi.mock("../lib/errors", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/errors")>();
  return {
    ...actual,
    handleError: vi.fn(),
  };
});

type MediaListener = (event: MediaQueryListEvent) => void;

function createStorageMock(options: { failWrite?: boolean } = {}): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: vi.fn(() => items.clear()),
    getItem: vi.fn((key: string) => items.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(items.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      items.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      if (options.failWrite) {
        throw new Error("blocked local storage");
      }
      items.set(key, value);
    }),
  };
}

function installMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<MediaListener>();
  const media = {
    get matches() {
      return matches;
    },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: vi.fn((_type: "change", listener: MediaListener) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: "change", listener: MediaListener) => {
      listeners.delete(listener);
    }),
    addListener: vi.fn((listener: MediaListener) => {
      listeners.add(listener);
    }),
    removeListener: vi.fn((listener: MediaListener) => {
      listeners.delete(listener);
    }),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => media),
  });

  return {
    emit(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches: nextMatches, media: media.media } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
    media,
  };
}

function setThemeMetas(): void {
  document.head.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove());
  document.head.insertAdjacentHTML(
    "beforeend",
    `<meta name="theme-color" content="${THEME_COLORS.light}" media="(prefers-color-scheme: light)" />`,
  );
  document.head.insertAdjacentHTML(
    "beforeend",
    `<meta name="theme-color" content="${THEME_COLORS.dark}" media="(prefers-color-scheme: dark)" />`,
  );
}

function themeMetaContents(): string[] {
  return Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')).map(
    (meta) => meta.content,
  );
}

describe("themeStore", () => {
  let localStorageMock: Storage;

  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    localStorageMock = createStorageMock();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
    installMatchMedia(false);
    setThemeMetas();
    document.documentElement.removeAttribute("data-theme");
  });

  it("falls back to system when stored preference is invalid", () => {
    localStorageMock.setItem("urinest-theme", "sepia");

    const store = useThemeStore();
    store.init();

    expect(store.preference).toBe("system");
    expect(store.resolved).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
  });

  it("reacts to OS theme changes only while preference is system", () => {
    const media = installMatchMedia(false);
    const store = useThemeStore();
    store.init();

    media.emit(true);
    expect(store.resolved).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);

    store.setTheme("light");
    media.emit(true);
    expect(store.preference).toBe("light");
    expect(store.resolved).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.light]);
  });

  it("restores per-media theme-color values when returning to system mode", () => {
    const media = installMatchMedia(true);
    const store = useThemeStore();
    store.init();

    store.setTheme("dark");
    expect(themeMetaContents()).toEqual([THEME_COLORS.dark, THEME_COLORS.dark]);

    media.emit(false);
    store.setTheme("system");

    expect(store.preference).toBe("system");
    expect(store.resolved).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
  });

  it("creates a fallback theme-color meta when none exist", () => {
    document.head.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove());
    const store = useThemeStore();

    store.setTheme("dark");

    const metas = Array.from(
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
    );
    expect(metas).toHaveLength(1);
    expect(metas[0]?.content).toBe(THEME_COLORS.dark);
  });

  it("reports storage write failure but still applies DOM theme", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock({ failWrite: true }),
    });
    const store = useThemeStore();

    store.setTheme("dark");

    expect(handleError).toHaveBeenCalledWith(
      new Error("Theme storage unavailable"),
      "theme:write-storage",
      { preference: "dark" },
    );
    expect(store.preference).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(themeMetaContents()).toEqual([THEME_COLORS.dark, THEME_COLORS.dark]);
  });
});
