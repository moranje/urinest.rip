<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const props = defineProps<{
  name?: string;
  to?: string;
}>();

const router = useRouter();
const hover = ref(false);
const touch = ref(false);

function tap(): void {
  touch.value = true;
}
</script>

<template>
  <button
    type="button"
    :class="{ 'menu-item': true, hover, touch }"
    :aria-label="name"
    @click="to ? router.push(to) : undefined"
    @keydown.enter.prevent="to ? router.push(to) : undefined"
    @keydown.space.prevent="to ? router.push(to) : undefined"
    @mouseover="hover = true"
    @mouseleave="hover = false"
    @focus="hover = true"
    @blur="hover = false"
    @touchstart="tap"
    @touchend="touch = false"
  >
    <div class="menu-image">
      <slot :hover="hover" :touch="touch"></slot>
    </div>
    <div :class="{ 'menu-text': true, hover, touch }">
      {{ name }}
    </div>
  </button>
</template>

<style scoped>
.menu-item {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: inherit;
  text-align: left;
  font: inherit;
  padding: 0;
  cursor: pointer;
  border-radius: var(--md-sys-shape-corner-medium);
  touch-action: manipulation;
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard),
    box-shadow var(--motion-duration-short) var(--motion-easing-standard);
}
.menu-item.hover {
  background-color: var(--md-sys-color-surface-variant);
  border-bottom-color: var(--md-sys-color-primary);
  transform: translateY(-1px);
  box-shadow: var(--md-sys-elevation-2);
}
.menu-item:active {
  transform: scale(0.97);
  transition-duration: var(--motion-duration-press);
}
.menu-image {
  flex: 4 1 0;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.menu-image > :deep(svg) {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}
.menu-text {
  flex-grow: 1;
  text-transform: uppercase;
  text-align: center;
  font: var(--md-sys-typescale-title-medium);
  padding: var(--spacing-sm) 0;
  transition: color var(--motion-duration-short) var(--motion-easing-standard);
}
.menu-text.hover {
  color: var(--md-sys-color-primary);
}
@media (hover: none) {
  .menu-item {
    user-select: none;
    background-color: var(--md-sys-color-surface-variant);
  }
  .menu-item.touch {
    border-bottom-color: var(--md-sys-color-primary);
  }
  .menu-text.touch {
    color: var(--md-sys-color-primary);
  }
}
</style>
