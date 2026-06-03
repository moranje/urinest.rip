<template>
  <QuestionnaireTemplate
    :is-loading="isLoading"
    :question="currentQuestion"
    :group-questions="isCurrentStepGrouped ? currentStepQuestions : []"
    :group-answers="groupAnswers"
    :group-title="currentStep?.title ?? currentQuestion?.text ?? ''"
    :is-grouped-step="isCurrentStepGrouped"
    :step-description="currentStep?.description"
    :description-html="compiledMarkdown(currentQuestion?.description)"
    :can-restart="hasHistory"
    :progress-value="progressValue"
    :progress-max="progressMax"
    :progress-label="progressLabel"
    :progress-text="progressText"
    :selected-option-ids="selectedOptionIds"
    :selected-count="selectedCount"
    :has-selected-options="hasSelectedOptions"
    :multi-select="isMultiSelect"
    :non-touch="isNonTouchDevice"
    :active-popover-option-id="activePopoverOptionId"
    :popover-html="compiledMarkdown(popoverDescription)"
    :popover-style="popoverStyle"
    @restart="restartQuestionnaire"
    @choose="isMultiSelect ? toggleOption($event) : selectOption($event)"
    @update-group-answer="updateGroupAnswer"
    @submit-group="submitGroupedStep"
    @show-popover="showPopover"
    @toggle-popover="togglePopover"
    @schedule-popover-close="schedulePopoverClose"
    @cancel-popover-close="cancelPopoverClose"
    @close-popover="closePopover"
    @confirm="confirmMultipleChoice"
  />
</template>

<script setup lang="ts">
import QuestionnaireTemplate from "../components/templates/QuestionnaireTemplate.vue";
import { useQuestionnairePageController } from "../composables/useQuestionnairePageController";

const props = defineProps<{
  id: string;
}>();

const {
  activePopoverOptionId,
  cancelPopoverClose,
  closePopover,
  compiledMarkdown,
  confirmMultipleChoice,
  currentQuestion,
  currentStep,
  currentStepQuestions,
  groupAnswers,
  hasHistory,
  hasSelectedOptions,
  isCurrentStepGrouped,
  isLoading,
  isMultiSelect,
  isNonTouchDevice,
  popoverDescription,
  popoverStyle,
  progressLabel,
  progressMax,
  progressText,
  progressValue,
  restartQuestionnaire,
  schedulePopoverClose,
  selectOption,
  selectedCount,
  selectedOptionIds,
  showPopover,
  submitGroupedStep,
  toggleOption,
  togglePopover,
  updateGroupAnswer,
} = useQuestionnairePageController(() => props.id);
</script>
