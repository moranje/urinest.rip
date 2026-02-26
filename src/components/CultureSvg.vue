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
    viewBox="0 0 200 200"
    :class="{ culture: true, hover: props.hover, touch: props.touch }"
  >
    <!-- Petri Dish -->
    <g
      class="base-lines"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="100" cy="100" r="85" fill="var(--md-sys-color-surface-container-lowest)" />
      <circle cx="100" cy="100" r="95" stroke-opacity="0.5" />
      <path d="M 40 80 A 65 65 0 0 1 120 38" stroke-opacity="0.2" stroke-width="6" />
    </g>

    <!-- Colonies -->
    <g
      class="colonies"
      fill="var(--md-sys-color-primary)"
      stroke="var(--md-sys-color-surface)"
      stroke-width="1.5"
    >
      <!-- primary colored -->
      <circle cx="90" cy="90" r="6" class="colony c-1" />
      <circle cx="110" cy="70" r="8" class="colony c-2" />
      <circle cx="60" cy="100" r="5" class="colony c-3" />
      <circle cx="120" cy="120" r="7" class="colony c-4" />
      <circle cx="50" cy="70" r="9" class="colony c-5" />
      <circle cx="140" cy="90" r="4" class="colony c-6" />
      <circle cx="80" cy="50" r="7" class="colony c-7" />
      <circle cx="130" cy="150" r="6" class="colony c-8" />
      <circle cx="50" cy="130" r="5" class="colony c-9" />

      <!-- tertiary colored -->
      <circle cx="70" cy="140" r="8" class="colony c-10 tertiary" />
      <circle cx="150" cy="110" r="5" class="colony c-11 tertiary" />
      <circle cx="100" cy="135" r="7" class="colony c-12 tertiary" />
      <circle cx="85" cy="115" r="4" class="colony c-13 tertiary" />
      <circle cx="115" cy="45" r="6" class="colony c-14 tertiary" />
    </g>
  </svg>
</template>

<style scoped>
.culture {
  height: 10em;
  color: var(--md-sys-color-outline);
}

.base-lines circle {
  transition: fill 0.8s var(--motion-easing-standard);
}

.colony {
  opacity: 0;
  transform: scale(0.5);
  transform-box: fill-box;
  transform-origin: center;
}

.tertiary {
  fill: var(--md-sys-color-tertiary);
}

/* Base colors for empty/inactive state */
@media screen and (hover: none) {
  .culture:not(.touch) .colony {
    opacity: 0.2;
    transform: scale(0.8);
    fill: var(--md-sys-color-outline-variant);
  }
}
@media screen and (hover: hover) {
  .culture:not(.hover) .colony {
    opacity: 0.2;
    transform: scale(0.8);
    fill: var(--md-sys-color-outline-variant);
  }
}

/* Animations */
@keyframes bloom {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.culture.hover .colony,
.culture.touch .colony {
  animation: bloom 0.8s var(--motion-easing-emphasized) forwards;
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
  animation-delay: 0.4s;
}
.c-6 {
  animation-delay: 0.15s;
}
.c-7 {
  animation-delay: 0.35s;
}
.c-8 {
  animation-delay: 0.45s;
}
.c-9 {
  animation-delay: 0.5s;
}
.c-10 {
  animation-delay: 0.55s;
}
.c-11 {
  animation-delay: 0.6s;
}
.c-12 {
  animation-delay: 0.65s;
}
.c-13 {
  animation-delay: 0.7s;
}
.c-14 {
  animation-delay: 0.75s;
}
</style>
