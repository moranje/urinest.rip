<template>
  <div class="theme-toggle" role="radiogroup" aria-label="Thema">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      class="theme-option"
      :class="{ 'theme-option--active': preference === item.value }"
      role="radio"
      :aria-checked="preference === item.value"
      :aria-label="item.label"
      :title="item.label"
      @click="setTheme(item.value)"
    >
      <Icon :name="item.icon" :size="18" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useThemeStore } from "../store/themeStore";
import Icon from "./primitives/Icon.vue";
import type { ThemePreference } from "../types";

const themeStore = useThemeStore();
const { preference } = storeToRefs(themeStore);
const { setTheme } = themeStore;

type ThemeIconName = "monitor" | "sun" | "moon";

const items: Array<{ value: ThemePreference; label: string; icon: ThemeIconName }> = [
  {
    value: "system",
    label: "Systeemthema",
    icon: "monitor",
  },
  {
    value: "light",
    label: "Licht thema",
    icon: "sun",
  },
  {
    value: "dark",
    label: "Donker thema",
    icon: "moon",
  },
];
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-surface-container-low);
}

.theme-option {
  width: 34px;
  height: 34px;
  min-width: 34px;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--md-sys-shape-corner-full);
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
}

.theme-option--active {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}
</style>
