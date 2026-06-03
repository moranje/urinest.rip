<template>
  <LandingTemplate
    :items="questionnaireStore.questionnaireList"
    :icon-keys="landingIconKeys"
    title="Beslishulp urineonderzoek — kies een test"
    label="Beslishulp urineonderzoek"
    secondary-heading="Urineweginfecties"
    :questionnaire-path="questionnairePath"
    :icon-component="resolveLandingIconComponent"
    :prefetch-questionnaire="prefetchQuestionnaire"
    @prefetch-error="handlePrefetchError"
  />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import LandingTemplate from "../components/templates/LandingTemplate.vue";
import {
  landingIconKeys,
  questionnairePath,
  resolveLandingIconComponent,
} from "../lib/app-compatibility";
import { handleError } from "../lib/errors";
import { useQuestionnaireStore } from "../store/questionnaireStore";

const questionnaireStore = useQuestionnaireStore();

const questionnairePageChunk = () => import("./QuestionnairePage.vue");

const prefetchQuestionnaire = async (_id: string): Promise<void> => {
  await Promise.all([questionnaireStore.loadInitialData(), questionnairePageChunk()]);
};

const handlePrefetchError = (error: unknown, id: string): void => {
  handleError(error, "landing:prefetch-questionnaire", { questionnaireId: id });
};

onMounted(async () => {
  if (!questionnaireStore.dataReady && !questionnaireStore.isLoading) {
    await questionnaireStore.loadInitialData();
  }
});
</script>
