<script lang="ts" setup>
  import { QuestionModel } from '@/components/form-shared';
  import { useStore } from '@/store/store';

  const router = useRouter();
  const questions = ref([
    {
      type: 'multiplechoice',
      id: 'nitrite',
      title: 'Nitriet test',
      nextStepOnAnswer: true,
      options: [
        {
          label: 'Positief',
          value: 'positive',
        },
        {
          label: 'Negatief',
          value: 'negative',
        },
      ],
      descriptionLink: [
        {
          url: 'https://richtlijnen.nhg.org/landelijke-eerstelijns-samenwerkingsafspraken/laboratoriumdiagnostiek#volledige-tekst-urineweginfecties',
          text: 'Testeigenschappen',
          target: '_blank',
        },
      ],
      jump: {
        positive: '_submit',
      },
      required: true,
      multiple: false,
      model: '',
    },
    {
      type: 'multiplechoice',
      id: 'leukocytes',
      title: 'Leukocyten test',
      nextStepOnAnswer: true,
      options: [
        {
          label: '+',
          value: 'positive',
        },
        {
          label: '++',
          value: 'positive',
        },
        {
          label: '+++',
          value: 'positive',
        },
        {
          label: 'Negatief',
          value: 'negative',
        },
      ],
      descriptionLink: [
        {
          url: 'https://richtlijnen.nhg.org/landelijke-eerstelijns-samenwerkingsafspraken/laboratoriumdiagnostiek#volledige-tekst-urineweginfecties',
          text: 'Testeigenschappen',
          target: '_blank',
        },
      ],
      jump: {
        positive: '_submit',
      },
      required: true,
      multiple: false,
      model: '',
    },
    {
      type: 'multiplechoice',
      id: 'hematuria',
      title: 'Erytrocyten test',
      nextStepOnAnswer: true,
      options: [
        {
          label: '+',
          value: 'positive',
        },
        {
          label: '++',
          value: 'positive',
        },
        {
          label: '+++',
          value: 'positive',
        },
        {
          label: '++++',
          value: 'positive',
        },
        {
          label: 'Negatief',
          value: 'negative',
        },
      ],
      required: true,
      multiple: false,
      model: '',
    },
  ]);

  function navigate(answeredQuestions: QuestionModel[], loading: boolean) {
    loading = true;
    const [nitrite, leucocyte, erythrocyte] = answeredQuestions;
    const store = useStore();

    if (nitrite.answer === 'positive') {
      router.push({ path: '/uwi' }).then(() => {
        loading = false;
      });
    } else if (leucocyte.answer === 'positive') {
      router.push({ path: '/leukocyturie' }).then(() => {
        loading = false;
      });
    } else if (erythrocyte.answer === 'positive') {
      router.push({ path: '/hematurie' }).then(() => {
        loading = false;
      });
    } else {
      store.setPath('other.noConclusiveAbnormality.0');
      router.push({ path: '/advies' }).then(() => {
        loading = false;
      });
    }
  }
</script>

<template>
  <FlowFormWrapper
    name="Urinestrip"
    :questions="questions"
    @complete="navigate"
  />
</template>
