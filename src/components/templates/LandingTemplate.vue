<template>
  <div class="landing-template">
    <div class="landing-template__content">
      <h1 class="sr-only">{{ title }}</h1>
      <LandingMenuGrid
        :items="items"
        :icon-keys="iconKeys"
        :label="label"
        :secondary-heading="secondaryHeading"
      >
        <template #primary="{ viewItem }">
          <MenuItem
            v-slot="{ hover, touch }"
            :to="questionnairePath(viewItem.id)"
            :name="viewItem.label"
          >
            <component
              :is="iconComponent(viewItem.icon)"
              v-if="iconComponent(viewItem.icon)"
              :hover="hover"
              :touch="touch"
            />
          </MenuItem>
        </template>

        <template #secondary="{ viewItem }">
          <router-link
            :to="questionnairePath(viewItem.id)"
            class="landing-template__secondary-tile"
          >
            <span class="landing-template__secondary-title">{{ viewItem.label }}</span>
            <span class="landing-template__secondary-description">{{ viewItem.description }}</span>
          </router-link>
        </template>
      </LandingMenuGrid>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import { LandingMenuGrid, type BeslismodelLandingMenuSource } from "@beslismodel/vue";
import MenuItem from "../MenuItem.vue";

withDefaults(
  defineProps<{
    items: readonly BeslismodelLandingMenuSource[];
    iconKeys: readonly string[];
    title: string;
    label: string;
    secondaryHeading?: string;
    questionnairePath: (id: string) => string;
    iconComponent: (icon: string | undefined) => Component | null;
  }>(),
  {
    secondaryHeading: "",
  },
);
</script>

<style scoped>
.landing-template {
  padding: var(--spacing-lg);
}

.landing-template__content {
  --landing-tile-size: clamp(16rem, 18vw, 20rem);

  max-width: var(--layout-content-max-width);
  margin: 0 auto;
  container-type: inline-size;
  container-name: landing;
}

:deep(.bm-landing-menu-grid__primary) {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(var(--spacing-lg), 4vw, var(--spacing-2xl));
  justify-content: center;
  align-items: start;
}

:deep(.bm-landing-menu-grid__primary-item) {
  inline-size: 100%;
  max-inline-size: var(--landing-tile-size);
  aspect-ratio: 1 / 1;
  justify-self: center;
  overflow: hidden;
}

:deep(.bm-landing-menu-grid__primary-item > *) {
  inline-size: 100%;
  block-size: 100%;
}

@container landing (max-width: 44rem) {
  :deep(.bm-landing-menu-grid__primary) {
    --landing-tile-size: clamp(13rem, 32vw, 17rem);
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container landing (max-width: 30rem) {
  :deep(.bm-landing-menu-grid__primary) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-md);
  }
}

@container landing (max-width: 22rem) {
  :deep(.bm-landing-menu-grid__primary) {
    grid-template-columns: minmax(0, var(--landing-tile-size));
  }
}

:deep(.bm-landing-menu-grid__secondary) {
  margin-top: var(--spacing-xl, 2rem);
}

:deep(.bm-landing-menu-grid__secondary-heading) {
  margin: 0 0 var(--spacing-md);
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-title-medium);
}

:deep(.bm-landing-menu-grid__secondary-items) {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

:deep(.bm-landing-menu-grid__secondary-item > *) {
  inline-size: 100%;
  block-size: 100%;
}

.landing-template__secondary-tile {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container-low);
  color: inherit;
  text-decoration: none;
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    box-shadow var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard);
}

.landing-template__secondary-tile:hover {
  background: var(--md-sys-color-surface-container);
  box-shadow: var(--md-sys-elevation-1);
}

.landing-template__secondary-title {
  color: var(--md-sys-color-primary);
  font: var(--md-sys-typescale-title-small);
}

.landing-template__secondary-description {
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-body-small);
}

@container landing (max-width: 37.5rem) {
  :deep(.bm-landing-menu-grid__secondary-items) {
    grid-template-columns: 1fr 1fr;
  }
}

@container landing (max-width: 30rem) {
  :deep(.bm-landing-menu-grid__secondary-items) {
    grid-template-columns: 1fr;
  }
}

@media only screen and (max-width: 479.98px) {
  .landing-template {
    padding: var(--spacing-sm);
  }
}
</style>
