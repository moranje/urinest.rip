<script lang="ts" setup>
  import { useStore } from '@/store/store';
  import { QuestionModel, Result } from '@/components/form-shared';

  const router = useRouter();
  const questions = reactive<QuestionModel[]>([
    {
      type: 'multiplechoice',
      id: 'healthyWoman',
      title: 'Is één van de volgende criteria NIET waar',
      nextStepOnAnswer: true,
      options: [
        {
          label:
            'Patiënte heeft eerder een aangetoonde urineweginfecties gehad',
          value: 'negative',
        },
        {
          label: 'Pijn bij het plassen is de op de voorgrond staande klacht',
          value: 'negative',
        },
        {
          label:
            'Is zijn geen tekenen van weefselinvasie (koorts, koude rillingen, flankpijn, pijn bilnaad, verwardheid)',
          value: 'negative',
        },
        {
          label: 'De klachten bestaan korter dan een week',
          value: 'negative',
        },
        {
          label: 'Er is geen verhoogd risico op een soa',
          value: 'negative',
        },
        {
          label: 'Er is geen vaginale irritatie/er zijn geen fluorklachten',
          value: 'negative',
        },
        {
          label: 'patiënte zelf denkt dat er sprake is van een cystitis',
          value: 'negative',
        },
        {
          label: 'Bovenstaande vragen zijn allen WEL waar',
          value: 'positive',
        },
      ],
      descriptionLink: [
        {
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-evaluatie',
          text: 'Risico op onterechte cystitis diagnose 20%',
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
    const [patient] = answeredQuestions;

    if (patient.answer === 'positive') {
      store.setPath(`uti.local.healthy.0`);
    } else {
      store.setPath(`other.ruleNotApplicable.0`);
    }

    router.push({ path: '/advies' }).then(() => {
      loading = false;
    });
  }
</script>

<template>
  <FlowFormWrapper
    name="Gezonde vrouwen"
    :questions="questions"
    @complete="navigate"
  />
</template>

<!-- Stel, indien toch geen urineonderzoek plaatsvindt, de diagnose alleen indien er sprake is van alle onderstaande criteria:
- patiënte heeft eerder een aangetoonde urineweginfecties gehad
- pijn bij het plassen is de op de voorgrond staande klacht
- de klachten bestaan korter dan een week
- er is geen verhoogd risico op een soa
- er is geen vaginale irritatie/er zijn geen fluorklachten, en
- patiënte zelf denkt dat er sprake is van een cystitis -->
<!--

Indien de diagnose alleen op basis van de anamnese gesteld wordt, is het risico op het onterecht voorschrijven van antibiotica ongeveer 20%. -->
