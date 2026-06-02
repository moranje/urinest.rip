<template>
  <LandingTemplate
    :items="questionnaireStore.questionnaireList"
    :icon-keys="landingIconKeys"
    title="Beslishulp urineonderzoek — kies een test"
    label="Beslishulp urineonderzoek"
    secondary-heading="Urineweginfecties"
    :questionnaire-path="questionnairePath"
    :icon-component="iconComponent"
  />
</template>

<script setup lang="ts">
import { onMounted, type Component } from "vue";
import HealthySvg from "../components/HealthySvg.vue";
import StripSvg from "../components/StripSvg.vue";
import DipslideSvg from "../components/DipslideSvg.vue";
import SedimentSvg from "../components/SedimentSvg.vue";
import CultureSvg from "../components/CultureSvg.vue";
import LandingTemplate from "../components/templates/LandingTemplate.vue";
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
