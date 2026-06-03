<template>
  <ResultTemplate
    :is-loading="isLoading"
    :error="error"
    :result="resultData"
    :documentation="planDocumentation"
    @documentation-copied="handleDocumentationCopied"
    @documentation-error="handleDocumentationCopyError"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useResultPage } from "../composables/useResultPage";
import { handleError } from "../lib/errors";
import { useToastStore } from "../store/toastStore";
import ResultTemplate from "../components/templates/ResultTemplate.vue";

const props = defineProps<{
  resultKey: string;
}>();

const toast = useToastStore();
const resultKey = computed(() => props.resultKey);
const { error, isLoading, planDocumentation, resultData } = useResultPage(resultKey);

const handleDocumentationCopied = (): void => {
  navigator.vibrate?.(10);
  toast.success("Gekopieerd naar klembord");
};

const handleDocumentationCopyError = (copyError: unknown): void => {
  handleError(copyError, "result-page:copy-documentation", { resultKey: props.resultKey });
  toast.error("Kopiëren mislukt");
};
</script>
