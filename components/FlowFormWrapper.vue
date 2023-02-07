<script lang="ts" setup>
  import { FlowForm, Question } from './vue-flow-form.esm';
  import { language, QuestionModel } from './form-shared';

  const emit = defineEmits(['complete']);
  const props = withDefaults(
    defineProps<{
      name?: string;
      questions?: QuestionModel[];
    }>(),
    {
      name: 'form',
      questions: () => [],
    }
  );
  const loading = ref(false);

  useHead({
    titleTemplate: `${props.name} - urinest.rip`,
  });

  function onComplete(completed: boolean, questionList: any) {
    emit('complete', questionList, loading.value);
  }
</script>

<template>
  <flow-form
    v-if="!loading"
    :language="language"
    :standalone="false"
    :progressbar="false"
    :navigation="false"
    @complete="onComplete"
  >
    <question
      v-for="(question, index) in questions"
      v-bind="question"
      v-bind:key="'m' + index"
      v-model="question.model"
    >
    </question>
  </flow-form>

  <Spinner v-else class="spinner"></Spinner>
</template>

<style lang="scss" scoped>
  .spinner {
    height: 400px;
  }

  @media only screen and (max-width: 767px) {
    header.vff-header + .vff {
      margin-top: 4vh;
    }
  }

  @media screen and (max-width: 479px) {
    header.vff-header + .vff {
      margin-top: 0;
    }
  }
</style>
