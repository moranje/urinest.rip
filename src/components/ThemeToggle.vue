<template>
  <SegmentedControl
    :model-value="preference"
    :options="items"
    label="Thema"
    size="sm"
    icon-only
    @update:model-value="setTheme($event as ThemePreference)"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useThemeStore } from "../store/themeStore";
import SegmentedControl from "./molecules/SegmentedControl.vue";
import type { ThemePreference } from "../types";

type SegmentedOptions = InstanceType<typeof SegmentedControl>["$props"]["options"];

const themeStore = useThemeStore();
const { preference } = storeToRefs(themeStore);
const { setTheme } = themeStore;

const items: SegmentedOptions = [
  {
    value: "system",
    label: "Systeem",
    ariaLabel: "Systeemthema",
    title: "Systeemthema",
    icon: "monitor",
  },
  {
    value: "light",
    label: "Licht",
    ariaLabel: "Licht thema",
    title: "Licht thema",
    icon: "sun",
  },
  {
    value: "dark",
    label: "Donker",
    ariaLabel: "Donker thema",
    title: "Donker thema",
    icon: "moon",
  },
];
</script>
