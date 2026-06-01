<template>
  <div class="landing-page">
    <div class="landing-content">
      <h1 class="sr-only">Beslishulp urineonderzoek — kies een test</h1>
      <LandingMenuGrid
        :items="questionnaireStore.questionnaireList"
        :icon-keys="landingIconKeys"
        label="Beslishulp urineonderzoek"
        secondary-heading="Urineweginfecties"
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
          <router-link :to="questionnairePath(viewItem.id)" class="uti-tile">
            <span class="uti-tile-title">{{ viewItem.label }}</span>
            <span class="uti-tile-desc">{{ viewItem.description }}</span>
          </router-link>
        </template>
      </LandingMenuGrid>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, type Component } from "vue";
import { LandingMenuGrid } from "@beslismodel/vue";
import MenuItem from "../components/MenuItem.vue";
import HealthySvg from "../components/HealthySvg.vue";
import StripSvg from "../components/StripSvg.vue";
import DipslideSvg from "../components/DipslideSvg.vue";
import SedimentSvg from "../components/SedimentSvg.vue";
import CultureSvg from "../components/CultureSvg.vue";
import { useQuestionnaireStore } from "../store/questionnaireStore";

const questionnaireStore = useQuestionnaireStore();

const iconComponents = {
  culture: CultureSvg,
  dipslide: DipslideSvg,
  healthy: HealthySvg,
  sediment: SedimentSvg,
  strip: StripSvg,
} satisfies Record<string, Component>;

type LandingIcon = keyof typeof iconComponents;
const landingIconKeys = Object.keys(iconComponents);

const questionnairePath = (id: string): string => `/questionnaire/${id}`;

const iconComponent = (icon: string | undefined): Component | null =>
  icon && icon in iconComponents ? iconComponents[icon as LandingIcon] : null;

onMounted(async () => {
  if (!questionnaireStore.dataReady && !questionnaireStore.isLoading) {
    await questionnaireStore.loadInitialData();
  }
});
</script>

<style scoped>
.landing-page {
  padding: var(--spacing-lg);
}

.landing-content {
  --landing-tile-size: clamp(16rem, 18vw, 20rem);

  max-width: var(--layout-content-max-width);
  margin: 0 auto;
  container-type: inline-size;
  container-name: landing;
}

:deep(.bm-landing-menu-grid__primary) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, var(--landing-tile-size)));
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

/* UTI Section */
:deep(.bm-landing-menu-grid__secondary) {
  margin-top: var(--spacing-xl, 2rem);
}

:deep(.bm-landing-menu-grid__secondary-heading) {
  font: var(--md-sys-typescale-title-medium);
  color: var(--md-sys-color-on-surface-variant);
  margin: 0 0 var(--spacing-md);
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

.uti-tile {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  text-decoration: none;
  color: inherit;
  transition:
    background-color var(--motion-duration-short) var(--motion-easing-standard),
    box-shadow var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard);
}

.uti-tile:hover {
  background: var(--md-sys-color-surface-container);
  box-shadow: var(--md-sys-elevation-1);
}

.uti-tile-title {
  font: var(--md-sys-typescale-title-small);
  color: var(--md-sys-color-primary);
}

.uti-tile-desc {
  font: var(--md-sys-typescale-body-small);
  color: var(--md-sys-color-on-surface-variant);
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
  .landing-page {
    padding: var(--spacing-sm);
  }
}
</style>
