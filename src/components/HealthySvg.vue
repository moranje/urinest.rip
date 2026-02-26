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
    viewBox="0 0 200 250"
    :class="{ healthy: true, hover: props.hover, touch: props.touch }"
  >
    <g stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <!-- Ureters Behind Kidneys -->
      <path d="M 78 80 Q 75 120, 90 165" class="tube" />
      <path d="M 122 80 Q 125 120, 110 165" class="tube" />

      <!-- Left Kidney -->
      <path
        d="M 60 50 C 80 50, 90 70, 80 90 C 70 110, 40 110, 30 90 C 20 70, 40 50, 60 50 Z"
        class="organ"
      />

      <!-- Right Kidney -->
      <path
        d="M 140 50 C 120 50, 110 70, 120 90 C 130 110, 160 110, 170 90 C 180 70, 160 50, 140 50 Z"
        class="organ"
      />

      <!-- Bladder -->
      <path
        d="M 100 160 C 120 160, 130 180, 120 200 C 110 215, 90 215, 80 200 C 70 180, 80 160, 100 160 Z"
        class="organ"
      />

      <!-- Urethra -->
      <path d="M 100 215 L 100 240" class="tube" />

      <!-- Sparkles -->
      <path
        d="M 40 110 Q 40 130, 50 130 Q 40 130, 40 150 Q 40 130, 30 130 Q 40 130, 40 110"
        class="sparkle s1"
        stroke-width="3"
      />
      <path
        d="M 160 60 Q 160 80, 170 80 Q 160 80, 160 100 Q 160 80, 150 80 Q 160 80, 160 60"
        class="sparkle s2"
        stroke-width="3"
      />
      <path
        d="M 110 10 Q 110 20, 115 20 Q 110 20, 110 30 Q 110 20, 105 20 Q 110 20, 110 10"
        class="sparkle s3"
        stroke-width="2"
      />
    </g>
  </svg>
</template>

<style scoped>
.healthy {
  height: 10em;
  color: var(--md-sys-color-outline);
}

.organ {
  fill: var(--md-sys-color-surface);
  transition:
    fill 0.8s var(--motion-easing-standard),
    stroke 0.8s var(--motion-easing-standard);
}

.tube {
  transition: stroke 0.8s var(--motion-easing-standard);
}

.sparkle {
  fill: var(--md-sys-color-surface);
  stroke: var(--md-sys-color-outline);
  opacity: 0;
  transition: opacity 0.8s var(--motion-easing-standard);
}

/* Inactive states */
@media screen and (hover: none) {
  .healthy:not(.touch) .organ {
    fill: var(--md-sys-color-surface-container-highest);
    stroke: var(--md-sys-color-outline);
  }
  .healthy:not(.touch) .tube {
    stroke: var(--md-sys-color-outline);
  }
}
@media screen and (hover: hover) {
  .healthy:not(.hover) .organ {
    fill: var(--md-sys-color-surface-container-highest);
    stroke: var(--md-sys-color-outline);
  }
  .healthy:not(.hover) .tube {
    stroke: var(--md-sys-color-outline);
  }
}

/* Animations */
@keyframes heal-fill {
  0% {
    fill: var(--md-sys-color-surface);
    stroke: var(--md-sys-color-outline);
  }
  100% {
    fill: var(--md-sys-color-tertiary-container);
    stroke: var(--md-sys-color-tertiary);
  }
}

@keyframes heal-stroke {
  0% {
    stroke: var(--md-sys-color-outline);
  }
  100% {
    stroke: var(--md-sys-color-tertiary);
  }
}

@keyframes sparkle-twinkle {
  0% {
    transform: scale(0.5) rotate(0deg);
    opacity: 0;
    fill: var(--md-sys-color-surface);
    stroke: var(--md-sys-color-outline);
  }
  50% {
    transform: scale(1.1) rotate(90deg);
    opacity: 1;
    fill: var(--md-sys-color-tertiary-container);
    stroke: var(--md-sys-color-tertiary);
  }
  100% {
    transform: scale(1) rotate(180deg);
    opacity: 1;
    fill: var(--md-sys-color-primary-container);
    stroke: var(--md-sys-color-primary);
  }
}

.healthy.hover .organ,
.healthy.touch .organ {
  animation: heal-fill 1.5s var(--motion-easing-standard) forwards;
}

.healthy.hover .tube,
.healthy.touch .tube {
  animation: heal-stroke 1.5s var(--motion-easing-standard) forwards;
}

.healthy.hover .sparkle,
.healthy.touch .sparkle {
  animation: sparkle-twinkle 1.5s var(--motion-easing-standard) forwards;
}

.s1 {
  transform-origin: 40px 130px;
  animation-delay: 0s;
}
.s2 {
  transform-origin: 160px 80px;
  animation-delay: 0.2s;
}
.s3 {
  transform-origin: 110px 20px;
  animation-delay: 0.4s;
}
</style>
