<script lang="ts" setup>
  import { QuestionModel } from '@/components/form-shared';
  import { useStore } from '@/store/store';

  const router = useRouter();
  const questions = reactive([
    {
      type: 'multiplechoice',
      id: 'macConkey',
      title: 'MacConkey-agar (rood)',
      nextStepOnAnswer: true,
      options: [
        {
          label: 'Groei',
          value: 'positive',
        },
        {
          label: 'Geen groei',
          value: 'negative',
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
      id: 'cled',
      title: 'CLED-agar (groen)',
      nextStepOnAnswer: true,
      options: [
        {
          label: '10^4 KVE/ml of meer',
          value: 'positive',
        },
        {
          label: '10^3 KVE/ml of minder',
          value: 'negative',
        },
      ],
      descriptionLink: [
        {
          url: 'https://richtlijnen.nhg.org/download/1512',
          text: 'Schat het aantal kolonievormende eenheden',
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
    const [macConkey, cled] = answeredQuestions;

    if (macConkey.answer === 'positive') {
      router.push({ path: '/bacteriurie' }).then(() => {
        loading = false;
      });
    } else if (cled.answer === 'positive') {
      router.push({ path: '/bacteriurie' }).then(() => {
        loading = false;
      });
    } else {
      store.setPath(`other.negativeDipslide.0`);
      router.push({ path: '/advies' }).then(() => {
        loading = false;
      });
    }
  }
</script>

<template>
  <FlowFormWrapper
    name="Dipslide"
    :questions="questions"
    @complete="navigate" />
</template>
