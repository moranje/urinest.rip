<template>
  <svg
    class="icon"
    :class="{ 'icon--spin': spin, 'motion-spin': spin, 'motion-spin--slow': spin }"
    :style="{ width: sizePx, height: sizePx }"
    viewBox="0 0 24 24"
    :aria-hidden="title ? undefined : 'true'"
    :role="title ? 'img' : undefined"
  >
    <title v-if="title">{{ title }}</title>
    <path
      v-for="(path, index) in icon.paths"
      :key="index"
      :d="path"
      :fill="icon.filled ? 'currentColor' : 'none'"
      :stroke="icon.filled ? 'none' : 'currentColor'"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";

const icons = {
  activity: {
    filled: false,
    paths: ["M22 12h-4l-3 9L9 3l-3 9H2"],
  },
  "arrow-left": {
    filled: false,
    paths: ["M19 12H5", "m12 19-7-7 7-7"],
  },
  copy: {
    filled: true,
    paths: [
      "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1Zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2Zm0 16H8V7h11v14Z",
    ],
  },
  "check-circle": {
    filled: false,
    paths: ["M20 6 9 17l-5-5"],
  },
  "chevron-left": {
    filled: false,
    paths: ["m15 18-6-6 6-6"],
  },
  download: {
    filled: false,
    paths: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5", "M12 15V3"],
  },
  "file-text": {
    filled: true,
    paths: ["M17 13H7v-2h10m-3-8H5v14h14V8h-5V5M7 3h7l5 5v11H5V3Z"],
  },
  eye: {
    filled: true,
    paths: [
      "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5ZM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5Zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3Z",
    ],
  },
  "eye-off": {
    filled: true,
    paths: [
      "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16c.57-.23 1.18-.36 1.83-.36ZM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27Zm5.53 5.53 1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2Zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01Z",
    ],
  },
  "info-circle": {
    filled: true,
    paths: [
      "M11 9h2V7h-2m1 13a8 8 0 1 1 0-16 8 8 0 0 1 0 16m0-18a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1 15h2v-6h-2v6Z",
    ],
  },
  monitor: {
    filled: true,
    paths: [
      "M12 3H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h5v2H8v2h8v-2h-2v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-7Zm7 12H5V5h14v10Z",
    ],
  },
  moon: {
    filled: true,
    paths: ["M12.1 2.1a8.7 8.7 0 1 0 9.8 9.8 7 7 0 0 1-9.8-9.8Z"],
  },
  restart: {
    filled: false,
    paths: ["M23 4v6h-6", "M20.49 15a9 9 0 1 1-2.12-9.36L23 10"],
  },
  settings: {
    filled: true,
    paths: [
      "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.03-1.58ZM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6Z",
    ],
  },
  spinner: {
    filled: false,
    paths: ["M21 12a9 9 0 1 1-6.22-8.56"],
  },
  sun: {
    filled: true,
    paths: [
      "m6.76 4.84-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42ZM1 13h3v-2H1v2Zm10-12v3h2V1h-2Zm9.04 2.46-1.41-1.41-1.8 1.79 1.42 1.42 1.79-1.8ZM17.24 19.16l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4ZM20 11v2h3v-2h-3ZM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm-1 17h2v-3h-2v3ZM3.55 19.54l1.41 1.41 1.8-1.79-1.42-1.42-1.79 1.8Z",
    ],
  },
  warning: {
    filled: true,
    paths: ["M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z"],
  },
  "warning-circle": {
    filled: false,
    paths: ["M12 8v4", "M12 16h.01", "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"],
  },
  "warning-triangle": {
    filled: false,
    paths: [
      "M12 9v4",
      "M12 17h.01",
      "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
    ],
  },
  "wifi-off": {
    filled: true,
    paths: [
      "M2.05 7.05a14.85 14.85 0 0 1 5.27-3.43L5.85 2.15A16.85 16.85 0 0 0 .64 5.63Zm9.95 0a14.85 14.85 0 0 1 9.95 4l1.46-1.45A16.85 16.85 0 0 0 12 5q-.34 0-.66.02ZM12 13a4 4 0 0 0-2.83 1.17L12 17l2.83-2.83A4 4 0 0 0 12 13Zm9.19-5.36-1.45 1.45A11.85 11.85 0 0 1 21.95 11l-1.46 1.46A9.85 9.85 0 0 0 12 9l9.19-1.36ZM3 21 21 3l-1.41-1.42-18 18L3 21Zm4.76-4.05a4.85 4.85 0 0 1 3.07-1.4l2.34 2.34-2.83 2.83-2.58-3.77Z",
    ],
  },
  x: {
    filled: false,
    paths: ["M18 6 6 18", "M6 6l12 12"],
  },
} as const;

type IconName = keyof typeof icons;

const props = withDefaults(
  defineProps<{
    name: IconName;
    size?: number | string;
    title?: string;
    spin?: boolean;
  }>(),
  {
    size: 20,
    title: undefined,
    spin: false,
  },
);

const icon = computed(() => icons[props.name]);
const sizePx = computed(() => (typeof props.size === "number" ? `${props.size}px` : props.size));
</script>

<style scoped>
.icon {
  display: inline-block;
  flex-shrink: 0;
}
</style>
