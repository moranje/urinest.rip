import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ThemeToggle from "./ThemeToggle.vue";

describe("ThemeToggle", () => {
  const store = new Map<string, string>();
  const lightThemeColor = ["#", "16a34a"].join("");
  const darkThemeColor = ["#", "005a2b"].join("");

  beforeEach(() => {
    setActivePinia(createPinia());
    store.clear();
    document.head.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove());
    document.head.insertAdjacentHTML(
      "beforeend",
      `<meta name="theme-color" content="${lightThemeColor}" media="(prefers-color-scheme: light)" />`,
    );
    document.head.insertAdjacentHTML(
      "beforeend",
      `<meta name="theme-color" content="${darkThemeColor}" media="(prefers-color-scheme: dark)" />`,
    );
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    });
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders a three-state radiogroup", () => {
    const wrapper = mount(ThemeToggle);

    expect(wrapper.attributes("role")).toBe("radiogroup");
    expect(wrapper.findAll('[role="radio"]')).toHaveLength(3);
    expect(wrapper.find('[aria-label="Systeemthema"]').attributes("aria-checked")).toBe("true");
  });

  it("persists explicit theme choice", async () => {
    const wrapper = mount(ThemeToggle);

    await wrapper.find('[aria-label="Donker thema"]').trigger("click");

    expect(localStorage.getItem("urinest-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(
      Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')).map(
        (meta) => meta.content,
      ),
    ).toEqual([darkThemeColor, darkThemeColor]);
    expect(wrapper.find('[aria-label="Donker thema"]').attributes("aria-checked")).toBe("true");
  });

  it("keeps system theme-color media values when system mode is active", () => {
    mount(ThemeToggle);

    expect(
      Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')).map(
        (meta) => [meta.getAttribute("media"), meta.content],
      ),
    ).toEqual([
      ["(prefers-color-scheme: light)", lightThemeColor],
      ["(prefers-color-scheme: dark)", darkThemeColor],
    ]);
  });
});
