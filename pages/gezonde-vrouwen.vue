<script lang="ts" setup>
  import { useStore } from '@/store/store';
  import { Choice, QuestionModel, Result } from '@/components/form-shared';

  const router = useRouter();
  const questions = reactive<QuestionModel[]>([
    {
      type: 'multiplechoice',
      id: 'healthyWoman',
      title: 'Wat is klopt er?',
      nextStepOnAnswer: true,
      options: [
        {
          label:
            'Patiënte heeft eerder een test bewezen urineweginfecties gehad',
          value: '1',
        },
        {
          label: 'Pijn bij het plassen is de op de voorgrond staande klacht',
          value: '2',
        },
        {
          label:
            'Er zijn geen tekenen van weefselinvasie (koorts, koude rillingen, flankpijn, pijn bilnaad, verwardheid)',
          value: '3',
        },
        {
          label: 'De klachten bestaan korter dan een week',
          value: '4',
        },
        {
          label: 'Er is geen verhoogd risico op een soa',
          value: '5',
        },
        {
          label: 'Er is geen vaginale irritatie/er zijn geen fluorklachten',
          value: '6',
        },
        {
          label: 'Patiënte zelf denkt dat er sprake is van een cystitis',
          value: '7',
        },
      ],
      descriptionLink: [
        {
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-evaluatie',
          text: 'Risico op onterechte cystitis diagnose 20%',
          target: '_blank',
        },
      ],
      jump: () => {
        const store = useStore();
        const [patient] = questions;

        if (patient.model?.length !== 7) {
          store.setPath(`other.ruleNotApplicable.0`);

          router.push({ path: '/advies' });
        }
      },
      required: true,
      multiple: true,
      model: '',
    },
    {
      type: 'multiplechoice',
      id: 'antibiotics',
      title: 'Welke behandeling kan patiënt krijgen',
      nextStepOnAnswer: true,
      options: [
        {
          label: 'Afwachtend beleid (eventueel met pijnstilling)',
          value: '0',
        },
        {
          label: 'Nitrofurantoïne',
          value: '1',
        },
        {
          label: 'Fosfomycine',
          value: '2',
        },
        {
          label: 'Trimethoprim',
          value: '3',
        },
      ],
      jump: () => {
        const store = useStore();
        const [_, antibiotics] = questions;

        store.setPath(`uti.local.healthy.${antibiotics.model as Choice}`);
      },
      required: true,
      multiple: false,
      model: '',
    },
  ]);

  function navigate(answeredQuestions: QuestionModel[], loading: boolean) {
    loading = true;

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
