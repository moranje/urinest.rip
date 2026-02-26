<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    hover?: boolean;
    touch?: boolean;
  }>(),
  {
    hover: false,
    touch: false,
  },
);
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 400 60"
    :class="{ strip: true, hover: props.hover, touch: props.touch }"
  >
    <!-- Background Stick Outline -->
    <rect
      x="10"
      y="15"
      width="370"
      height="30"
      rx="4"
      stroke="currentColor"
      stroke-width="3"
      fill="var(--md-sys-color-surface-container)"
    />

    <!-- Pads -->
    <g class="pads" stroke="currentColor" stroke-width="2">
      <!-- Standard neutral pads -->
      <rect x="25" y="20" width="15" height="20" rx="2" class="pad pad-neutral" />
      <rect x="55" y="20" width="15" height="20" rx="2" class="pad pad-neutral" />
      <rect x="85" y="20" width="15" height="20" rx="2" class="pad pad-neutral" />
      <rect x="115" y="20" width="15" height="20" rx="2" class="pad pad-neutral" />
      <rect x="145" y="20" width="15" height="20" rx="2" class="pad pad-neutral" />
      <rect x="175" y="20" width="15" height="20" rx="2" class="pad pad-neutral" />
      <rect x="205" y="20" width="15" height="20" rx="2" class="pad pad-neutral" />

      <!-- The test-positive pad (animates to purple) -->
      <rect x="235" y="20" width="15" height="20" rx="2" class="pad test-positive" />

      <!-- More neutral pads -->
      <rect x="265" y="20" width="15" height="20" rx="2" class="pad pad-neutral" />
      <rect x="295" y="20" width="15" height="20" rx="2" class="pad pad-neutral" />
    </g>
  </svg>
</template>

<style scoped>
.strip {
  height: 10em;
  color: var(--md-sys-color-outline);
  transform-origin: 61% 50%;
}

.pad {
  fill: var(--md-sys-color-surface);
  transition: fill 0.8s var(--motion-easing-standard);
}

/* Neutral pads simply get a subtle tone when activated */
@keyframes tone-shift {
  0% {
    fill: var(--md-sys-color-surface);
  }
  100% {
    fill: var(--md-sys-color-surface-container-high);
  }
}

/* The positive pad animates to a vivid purple */
@keyframes colorize-purple {
  0% {
    fill: var(--md-sys-color-surface);
  }
  100% {
    fill: #a855f7;
  }
}

@keyframes zoom-in {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(3.5);
  }
}

.strip.hover {
  animation: zoom-in 1s var(--motion-easing-emphasized) forwards;
}

.strip.hover .pad-neutral,
.strip.touch .pad-neutral {
  animation: tone-shift 1.5s var(--motion-easing-standard) forwards;
}

.strip.hover .test-positive,
.strip.touch .test-positive {
  animation: colorize-purple 3s var(--motion-easing-standard) forwards;
}

@media screen and (hover: none) {
  .strip:not(.touch) .pad {
    fill: var(--md-sys-color-surface-container-highest);
  }
}
@media screen and (hover: hover) {
  .strip:not(.hover) .pad {
    fill: var(--md-sys-color-surface-container-highest);
  }
}
</style>
