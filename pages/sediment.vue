<script lang="ts" setup>
  import { useStore } from '@/store/store';
  import { Conclusion, QuestionModel } from '@/components/form-shared';

  const router = useRouter();
  const questions = reactive([
    {
      type: 'multiplechoice',
      id: 'bacteruria',
      title: 'Bacteriurie?',
      nextStepOnAnswer: true,
      options: [
        {
          label: 'Meer dan 20 bacteriën per gezichtveld',
          value: 'positive',
        },
        {
          label: 'Veel plaveiselepitheel',
          value: 'contaminatedSediment',
        },
        {
          label: 'Minder dan 20 bacteriën per gezichtveld',
          value: 'noConclusiveAbnormality',
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
    const [bacteruria] = answeredQuestions;

    if (bacteruria.answer === 'positive') {
      router.push({ path: '/uwi' }).then(() => {
        loading = false;
      });
    } else if (bacteruria.answer === 'contaminatedSediment') {
      store.setPath(`other.${bacteruria.answer as Conclusion}.0`);
      router.push({ path: '/advies' }).then(() => {
        loading = false;
      });
    } else {
      store.setPath(`other.${bacteruria.answer as Conclusion}.0`);
      router.push({ path: '/advies' }).then(() => {
        loading = false;
      });
    }
  }
</script>

<template>
  <FlowFormWrapper
    name="Urine sediment"
    :questions="questions"
    @complete="navigate"
  />
</template>
