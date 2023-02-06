<script lang="ts" setup>
  import { useStore } from '@/store/store';
  import { QuestionModel, Result } from '@/components/form-shared';

  const router = useRouter();
  const questions = reactive([
    {
      type: 'multiplechoice',
      id: 'followUpTest',
      title: 'Wat voor soort hematurie?',
      nextStepOnAnswer: true,
      options: [
        {
          label: 'Zichtbare hematurie',
          value: 'visibleHematuria',
        },
        {
          label: 'Proteinurie',
          value: 'proteinuria',
        },
        {
          label: 'Microscopische hematurie',
          value: 'invisiableHematuria',
        },
      ],
      required: true,
      multiple: false,
      model: '',
    },
  ]);

  function navigate(answeredQuestions: QuestionModel[], loading: boolean) {
    loading = true;
    const store = useStore();
    const [test] = answeredQuestions;

    store.setPath(`blood.${test.answer as Result}.0`);
    router.push({ path: '/advies' }).then(() => {
      loading = false;
    });
  }
</script>

<template>
  <FlowFormWrapper
    name="Hematurie"
    :questions="questions"
    @complete="navigate"
  />
</template>
