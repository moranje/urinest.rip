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
    viewBox="0 0 100 240"
    :class="{ dipslide: true, hover: props.hover, touch: props.touch }"
  >
    <!-- Background Vial Outline -->
    <g
      class="vial"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M 20 20 L 20 200 A 30 30 0 0 0 80 200 L 80 20" />
      <path d="M 15 20 L 85 20" />
      <path d="M 10 10 L 90 10" />
      <path d="M 20 180 C 40 190, 60 190, 80 180" stroke-opacity="0.3" stroke-width="2" />
      <!-- liquid level -->
    </g>

    <!-- Dipslide Insert -->
    <g
      class="slide"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect
        x="35"
        y="40"
        width="30"
        height="140"
        rx="4"
        fill="var(--md-sys-color-surface-container-lowest)"
      />
      <!-- Grid lines -->
      <line x1="35" y1="75" x2="65" y2="75" stroke-opacity="0.3" />
      <line x1="35" y1="110" x2="65" y2="110" stroke-opacity="0.3" />
      <line x1="35" y1="145" x2="65" y2="145" stroke-opacity="0.3" />
    </g>

    <!-- Colonies -->
    <g
      class="colonies"
      fill="var(--md-sys-color-primary)"
      stroke="var(--md-sys-color-surface)"
      stroke-width="1"
    >
      <circle cx="45" cy="55" r="3" class="colony c-1" />
      <circle cx="55" cy="85" r="4" class="colony c-2" />
      <circle cx="42" cy="120" r="3" class="colony c-3 tertiary" />
      <circle cx="58" cy="155" r="5" class="colony c-4" />
      <circle cx="48" cy="170" r="4" class="colony c-5" />
      <circle cx="52" cy="65" r="2.5" class="colony c-6 tertiary" />
      <circle cx="40" cy="95" r="3.5" class="colony c-7" />
      <circle cx="55" cy="135" r="4.5" class="colony c-8 tertiary" />
    </g>
  </svg>
</template>

<style scoped>
.dipslide {
  height: 10em;
  color: var(--md-sys-color-outline);
}

.tertiary {
  fill: var(--md-sys-color-tertiary);
}

.colony {
  opacity: 0;
  transform: translateY(5px) scale(0.5);
  transform-box: fill-box;
  transform-origin: center;
}

/* Animations */
@keyframes pop-in {
  0% {
    opacity: 0;
    transform: translateY(5px) scale(0.5);
  }
  60% {
    opacity: 1;
    transform: translateY(-2px) scale(1.1);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dipslide.hover .colony,
.dipslide.touch .colony {
  animation: pop-in 0.6s var(--motion-easing-emphasized) forwards;
}

.c-1 {
  animation-delay: 0.1s;
}
.c-2 {
  animation-delay: 0.2s;
}
.c-3 {
  animation-delay: 0.3s;
}
.c-4 {
  animation-delay: 0.25s;
}
.c-5 {
  animation-delay: 0.15s;
}
.c-6 {
  animation-delay: 0.4s;
}
.c-7 {
  animation-delay: 0.35s;
}
.c-8 {
  animation-delay: 0.45s;
}

/* Base colors for empty/inactive state */
@media screen and (hover: none) {
  .dipslide:not(.touch) .colony {
    opacity: 0.3;
    transform: scale(0.8);
    fill: var(--md-sys-color-outline-variant);
  }
}
@media screen and (hover: hover) {
  .dipslide:not(.hover) .colony {
    opacity: 0.3;
    transform: scale(0.8);
    fill: var(--md-sys-color-outline-variant);
  }
}
</style>
