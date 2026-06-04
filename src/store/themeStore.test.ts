import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useThemeStore } from "./themeStore";
import { THEME_COLORS } from "../styles/themeColors";

type MediaListener = (event: MediaQueryListEvent) => void;

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
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    installMatchMedia(false);
    setThemeMetas();
    document.documentElement.removeAttribute("data-theme");
  });

  it("applies the system light theme and keeps per-media theme-color values", () => {
    const store = useThemeStore();
    store.init();

    expect(store.resolved).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
  });

  it("applies the system dark theme at startup", () => {
    installMatchMedia(true);
    const store = useThemeStore();
    store.init();

    expect(store.resolved).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
  });

  it("reacts to OS theme changes", () => {
    const media = installMatchMedia(false);
    const store = useThemeStore();
    store.init();

    media.emit(true);
    expect(store.resolved).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);

    media.emit(false);
    expect(store.resolved).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(themeMetaContents()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
  });

  it("creates a fallback theme-color meta when none exist", () => {
    document.head.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove());
    installMatchMedia(true);
    const store = useThemeStore();

    store.init();

    const metas = Array.from(
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
    );
    expect(metas).toHaveLength(1);
    expect(metas[0]?.content).toBe(THEME_COLORS.dark);
  });
});
