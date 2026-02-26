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
    viewBox="0 0 160 250"
    :class="{ sediment: true, hover: props.hover, touch: props.touch }"
  >
    <!-- Background Frame Outline -->
    <g
      class="microscope"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <!-- Base -->
      <path
        d="M 20 230 L 140 230 L 120 200 L 40 200 Z"
        fill="var(--md-sys-color-surface-container-low)"
      />
      <!-- Arm -->
      <path
        d="M 110 200 C 130 180, 140 100, 110 50 L 90 70 C 110 100, 100 160, 80 180 Z"
        fill="var(--md-sys-color-surface-container)"
      />
      <!-- Eyepiece Tube -->
      <rect
        x="50"
        y="20"
        width="30"
        height="60"
        rx="4"
        transform="rotate(-30 65 50)"
        fill="var(--md-sys-color-surface-container-high)"
      />
      <!-- Stage -->
      <path d="M 40 140 L 90 140" stroke-width="6" />
    </g>

    <!-- Glowing illumination elements (animates on hover) -->
    <g
      class="illumination"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <!-- Objective lens -->
      <rect x="50" y="90" width="16" height="20" rx="2" class="lens" />
      <rect x="70" y="95" width="12" height="15" rx="2" class="lens secondary" />

      <!-- Slide -->
      <rect x="45" y="130" width="40" height="6" rx="2" class="slide test-positive" />

      <!-- Light Source Base (lamp) -->
      <path d="M 50 190 Q 65 170 80 190" stroke-width="5" class="lamp test-positive" />

      <!-- Light Beams -->
      <path
        d="M 65 180 L 55 140 M 65 180 L 75 140"
        stroke-width="2"
        stroke-dasharray="4 4"
        class="beam test-positive"
      />
    </g>
  </svg>
</template>

<style scoped>
.sediment {
  height: 10em;
  color: var(--md-sys-color-outline);
}

.illumination .lens,
.illumination .slide,
.illumination .lamp {
  fill: var(--md-sys-color-surface);
  transition:
    fill 0.8s var(--motion-easing-standard),
    stroke 0.8s var(--motion-easing-standard);
}

.illumination .beam {
  stroke: transparent;
  transition: stroke 0.8s var(--motion-easing-standard);
}

/* Base colors for inactive state */
@media screen and (hover: none) {
  .sediment:not(.touch) .test-positive {
    fill: var(--md-sys-color-surface-container-highest);
    stroke: var(--md-sys-color-outline);
  }
}
@media screen and (hover: hover) {
  .sediment:not(.hover) .test-positive {
    fill: var(--md-sys-color-surface-container-highest);
    stroke: var(--md-sys-color-outline);
  }
}

/* Animations */
@keyframes power-on-fill {
  0% {
    fill: var(--md-sys-color-surface);
  }
  50% {
    fill: var(--md-sys-color-tertiary-container);
    stroke: var(--md-sys-color-tertiary);
  }
  100% {
    fill: var(--md-sys-color-primary-container);
    stroke: var(--md-sys-color-primary);
  }
}

@keyframes power-on-stroke {
  0% {
    stroke: transparent;
  }
  100% {
    stroke: color-mix(in srgb, var(--md-sys-color-primary) 50%, transparent);
  }
}

.sediment.hover .test-positive,
.sediment.touch .test-positive {
  animation: power-on-fill 1.5s var(--motion-easing-standard) forwards;
}

.sediment.hover .beam,
.sediment.touch .beam {
  animation: power-on-stroke 1.5s var(--motion-easing-standard) forwards;
}
</style>
