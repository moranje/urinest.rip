<template>
  <div class="question-toolbar">
    <BackButton
      v-if="hasHistory"
      class="question-toolbar__back"
      ariaLabel="Vorige vraag (Esc of Backspace)"
      @click="emit('back')"
    >
      Terug
    </BackButton>
    <span class="question-toolbar__spacer" />
    <IconButton
      v-if="hasHistory"
      class="question-toolbar__restart"
      icon="restart"
      ariaLabel="Opnieuw beginnen"
      @click="emit('restart')"
    />
  </div>
</template>

<script setup lang="ts">
import BackButton from "../primitives/BackButton.vue";
import IconButton from "../primitives/IconButton.vue";

defineProps<{
  hasHistory: boolean;
}>();

const emit = defineEmits<{
  back: [];
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
