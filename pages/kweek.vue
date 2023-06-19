<script lang="ts" setup>
  import { Conclusion, QuestionModel } from '@/components/form-shared';
  import { useStore } from '@/store/store';

  const router = useRouter();
  const questions = reactive([
    {
      type: 'multiplechoice',
      id: 'culture',
      title: 'Kweekuitslag',
      nextStepOnAnswer: true,
      options: [
        {
          label: 'Groei met 10^5 KVE/ml of meer',
          value: 'positive',
        },
        {
          label:
            'Groei met minder dan 10^5 KVE/ml met een aanhoudend vermoeden van een urineweginfectie',
          value: 'ambiguousCulture',
        },
        {
          label: 'Minder dan 10^5 KVE/ml of geen bacteriën',
          value: 'noUrineTractInfection',
        },
      ],
      descriptionLink: [
        {
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-begrippen',
          text: 'Afkapwaarde van 10^5 KVE',
          target: '_blank',
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
    const [culture] = answeredQuestions;

    if (culture.answer === 'positive') {
      router.push({ path: '/bacteriurie' }).then(() => {
        loading = false;
      });
    } else if (culture.answer === 'ambiguousCulture') {
      store.setPath(`other.${culture.answer as Conclusion}.0`);
      router.push({ path: '/advies' }).then(() => {
        loading = false;
      });
    } else {
      store.setPath(`other.${culture.answer as Conclusion}.0`);
      router.push({ path: '/advies' }).then(() => {
        loading = false;
      });
    }
  }
</script>

<template>
  <FlowFormWrapper
    name="Urinekweek"
    :questions="questions"
    @complete="navigate" />
</template>
