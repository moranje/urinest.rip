import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { THEME_COLORS } from "../styles/themeColors";

const QUERY = "(prefers-color-scheme: dark)";

function systemTheme(): "light" | "dark" {
  return window.matchMedia(QUERY).matches ? "dark" : "light";
}

function syncThemeColor(theme: "light" | "dark"): void {
  const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
  if (metas.length === 0) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = THEME_COLORS[theme];
    document.head.append(meta);
    return;
  }

  for (const meta of metas) {
    const media = meta.getAttribute("media") ?? "";
    if (media.includes("dark")) meta.content = THEME_COLORS.dark;
    else if (media.includes("light")) meta.content = THEME_COLORS.light;
    else meta.content = THEME_COLORS[theme];
  }
}

export const useThemeStore = defineStore("theme", () => {
  const system = ref<"light" | "dark">(systemTheme());
  const resolved = computed(() => system.value);

  const applyTheme = (): void => {
    document.documentElement.setAttribute("data-theme", resolved.value);
    syncThemeColor(resolved.value);
  };

  const init = (): void => {
    const media = window.matchMedia(QUERY);
    system.value = media.matches ? "dark" : "light";
    applyTheme();
    media.addEventListener("change", (event) => {
      system.value = event.matches ? "dark" : "light";
      applyTheme();
    });
  };

  return { resolved, init };
});
