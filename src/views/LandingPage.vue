<template>
  <div class="landing-page">
    <div class="landing-content">
      <h1 class="sr-only">Beslishulp urineonderzoek — kies een test</h1>
      <div class="landing-grid stagger-children">
        <MenuItem
          v-for="item in primaryItems"
          :key="item.id"
          v-slot="{ hover, touch }"
          :to="questionnairePath(item.id)"
          :name="questionnaireLabel(item)"
        >
          <component :is="item.component" :hover="hover" :touch="touch" />
        </MenuItem>
      </div>

      <section v-if="secondaryItems.length > 0" class="uti-section stagger-children">
        <h3 class="uti-heading">Urineweginfecties</h3>
        <div class="uti-grid">
          <router-link
            v-for="item in secondaryItems"
            :key="item.id"
            :to="questionnairePath(item.id)"
            class="uti-tile"
          >
            <span class="uti-tile-title">{{ questionnaireLabel(item) }}</span>
            <span class="uti-tile-desc">{{ landingDescription(item) }}</span>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, type Component } from "vue";
import MenuItem from "../components/MenuItem.vue";
import HealthySvg from "../components/HealthySvg.vue";
import StripSvg from "../components/StripSvg.vue";
import DipslideSvg from "../components/DipslideSvg.vue";
import SedimentSvg from "../components/SedimentSvg.vue";
import CultureSvg from "../components/CultureSvg.vue";
import { useQuestionnaireStore } from "../store/questionnaireStore";
import type { QuestionnaireMeta } from "../types";

const questionnaireStore = useQuestionnaireStore();

const iconComponents = {
  culture: CultureSvg,
  dipslide: DipslideSvg,
  healthy: HealthySvg,
  sediment: SedimentSvg,
  strip: StripSvg,
} satisfies Record<string, Component>;

type LandingIcon = keyof typeof iconComponents;
type LandingSection = "primary" | "secondary";

interface PrimaryLandingItem extends QuestionnaireMeta {
  component: Component;
}

const questionnairePath = (id: string): string => `/questionnaire/${id}`;

const landingOrder = (questionnaire: QuestionnaireMeta): number => {
  const order = questionnaire.metadata?.landingOrder;
  return typeof order === "number" ? order : Number.MAX_SAFE_INTEGER;
};

const sortByLandingOrder = (a: QuestionnaireMeta, b: QuestionnaireMeta): number =>
  landingOrder(a) - landingOrder(b) || a.title.localeCompare(b.title, "nl");

const iconComponent = (icon: string | undefined): Component | null =>
  icon && icon in iconComponents ? iconComponents[icon as LandingIcon] : null;

const landingSection = (questionnaire: QuestionnaireMeta): LandingSection => {
  const section = questionnaire.metadata?.landingSection;
  if (section === "primary" || section === "secondary") return section;
  return iconComponent(questionnaire.icon) ? "primary" : "secondary";
};

const questionnaireLabel = (questionnaire: QuestionnaireMeta): string =>
  questionnaire.name ?? questionnaire.title;

const landingDescription = (questionnaire: QuestionnaireMeta): string => {
  const description = questionnaire.metadata?.landingDescription;
  return typeof description === "string" ? description : (questionnaire.description ?? "");
};

const visibleQuestionnaires = computed(() =>
  [...questionnaireStore.questionnaireList]
    .filter((questionnaire) => !questionnaire.hiddenFromLandingPage)
    .sort(sortByLandingOrder),
);

const primaryItems = computed<PrimaryLandingItem[]>(() =>
  visibleQuestionnaires.value.flatMap((questionnaire) => {
    if (landingSection(questionnaire) !== "primary") return [];
    const component = iconComponent(questionnaire.icon);
    return component ? [{ ...questionnaire, component }] : [];
  }),
);

const secondaryItems = computed(() =>
  visibleQuestionnaires.value.filter((questionnaire) => {
    if (landingSection(questionnaire) === "secondary") return true;
    return !iconComponent(questionnaire.icon);
  }),
);

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

.landing-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, var(--landing-tile-size)));
  gap: clamp(var(--spacing-lg), 4vw, var(--spacing-2xl));
  justify-content: center;
  align-items: start;
}

.landing-grid > * {
  inline-size: 100%;
  max-inline-size: var(--landing-tile-size);
  aspect-ratio: 1 / 1;
  justify-self: center;
  overflow: hidden;
}

@container landing (max-width: 44rem) {
  .landing-grid {
    --landing-tile-size: clamp(13rem, 32vw, 17rem);
  }
}

@container landing (max-width: 30rem) {
  .landing-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-md);
  }
}

@container landing (max-width: 22rem) {
  .landing-grid {
    grid-template-columns: minmax(0, var(--landing-tile-size));
  }
}

/* UTI Section */
.uti-section {
  margin-top: var(--spacing-xl, 2rem);
}

.uti-heading {
  font: var(--md-sys-typescale-title-medium);
  color: var(--md-sys-color-on-surface-variant);
  margin: 0 0 var(--spacing-md);
}

.uti-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
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
  .uti-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@container landing (max-width: 30rem) {
  .uti-grid {
    grid-template-columns: 1fr;
  }
}

@media only screen and (max-width: 479.98px) {
  .landing-page {
    padding: var(--spacing-sm);
  }
}
</style>
