<script lang="ts" setup>
  import { useStore } from '@/store/store';
  import { QuestionModel, Test } from '@/components/form-shared';

  const router = useRouter();
  const questions = reactive([
    {
      type: 'multiplechoice',
      id: 'population',
      title: 'Behoort patiënt tot een van deze groepen',
      nextStepOnAnswer: true,
      options: [
        {
          label: 'Een kind jonger dan 12 jaar',
          value: 'child',
        },
        {
          label: 'Een kwetsbare oudere',
          value: 'elderly',
        },
        {
          label: 'Geen van deze',
          value: 'none',
        },
      ],
      description: 'Hoe definieer ik kwetsbaarheid?',
      descriptionLink: [
        {
          url: 'https://www.verenso.nl/richtlijnen-en-praktijkvoering/richtlijnendatabase/urineweginfecties',
          text: 'Zie definities en begrippen.',
          target: '_blank',
        },
      ],
      jump: () => {
        const [population, followUpTest] = questions;
        let options = [
          {
            label: 'Urinekweek',
            value: 'urineCulture',
          },
        ];

        if (population.model === 'none') {
          options.unshift(
            {
              label: 'Dipslide',
              value: 'dipslide',
            },
            {
              label: 'Urine sediment',
              value: 'urineSediment',
            }
          );
        } else if (population.model === 'child') {
          options.unshift({
            label: 'Dipslide',
            value: 'dipslide',
          });
        }

        followUpTest.options = options;
        // next question
      },
      required: true,
      multiple: false,
      model: '',
    },
    {
      type: 'multiplechoice',
      id: 'followUpTest',
      title: 'Welk vervolgonderzoek wordt geboden',
      nextStepOnAnswer: true,
      descriptionLink: [
        {
          url: 'https://richtlijnen.nhg.org/landelijke-eerstelijns-samenwerkingsafspraken/laboratoriumdiagnostiek#volledige-tekst-urineweginfecties',
          text: 'Testeigenschappen',
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
    const [_, followUpTest] = answeredQuestions;

    store.setPath(`leukocytes.${followUpTest.answer as Test}.0`);
    router.push({ path: '/advies' }).then(() => {
      loading = false;
    });
  }
</script>

<template>
  <FlowFormWrapper
    name="Leukocyturie"
    :questions="questions"
    @complete="navigate"
  />
</template>
