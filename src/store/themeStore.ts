import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { ThemePreference } from "../types";
import { handleError } from "../lib/errors";
import { readStorage, writeStorage } from "../lib/storage";

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

export const useThemeStore = defineStore("theme", () => {
  const preference = ref<ThemePreference>(readStoredTheme());
  const system = ref<"light" | "dark">(systemTheme());

  const resolved = computed(() =>
    preference.value === "system" ? system.value : preference.value,
  );

  const applyTheme = (): void => {
    document.documentElement.setAttribute("data-theme", resolved.value);
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
