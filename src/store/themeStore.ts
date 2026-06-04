import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { ThemePreference } from "../types";
import { handleError } from "../lib/errors";
import { readStorage, writeStorage } from "../lib/storage";
import { THEME_COLORS } from "../styles/themeColors";

const STORAGE_KEY = "urinest-theme";
const QUERY = "(prefers-color-scheme: dark)";

function readStoredTheme(): ThemePreference {
  const value = readStorage("local", STORAGE_KEY);
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

function systemTheme(): "light" | "dark" {
  return window.matchMedia(QUERY).matches ? "dark" : "light";
}

function syncThemeColor(theme: "light" | "dark", mode: ThemePreference): void {
  const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
  if (metas.length === 0) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.append(meta);
    metas.push(meta);
  }

  for (const meta of metas) {
    if (mode === "system") {
      const media = meta.getAttribute("media") ?? "";
      meta.content = media.includes("dark") ? THEME_COLORS.dark : THEME_COLORS.light;
    } else {
      meta.content = THEME_COLORS[theme];
    }
  }
}

export const useThemeStore = defineStore("theme", () => {
  const preference = ref<ThemePreference>(readStoredTheme());
  const system = ref<"light" | "dark">(systemTheme());

  const resolved = computed(() =>
    preference.value === "system" ? system.value : preference.value,
  );

  const applyTheme = (): void => {
    document.documentElement.setAttribute("data-theme", resolved.value);
    syncThemeColor(resolved.value, preference.value);
  };

  const setTheme = (next: ThemePreference): void => {
    preference.value = next;
    if (!writeStorage("local", STORAGE_KEY, next)) {
      handleError(new Error("Theme storage unavailable"), "theme:write-storage", {
        preference: next,
      });
    }
    applyTheme();
  };

  const init = (): void => {
    applyTheme();
    const media = window.matchMedia(QUERY);
    media.addEventListener("change", (event) => {
      system.value = event.matches ? "dark" : "light";
      if (preference.value === "system") applyTheme();
    });
  };

  return { preference, resolved, setTheme, init };
});
