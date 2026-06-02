<template>
  <div class="question-toolbar">
    <span class="question-toolbar__spacer" />
    <IconButton
      v-if="hasHistory"
      class="question-toolbar__restart"
      icon="restart"
      aria-label="Opnieuw beginnen"
      @click="emit('restart')"
    />
  </div>
</template>

<script setup lang="ts">
import IconButton from "../primitives/IconButton.vue";

defineProps<{
  hasHistory: boolean;
}>();

const emit = defineEmits<{
  restart: [];
}>();
</script>

<style scoped>
.question-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.question-toolbar__spacer {
  flex: 1;
}
</style>
