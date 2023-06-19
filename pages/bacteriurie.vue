<script lang="ts" setup>
  import { useStore } from '@/store/store';
  import { Choice, Group, QuestionModel, Type } from '@/components/form-shared';
  import data from '@/store/data.json';

  const router = useRouter();
  const questions = reactive([
    {
      type: 'multiplechoice',
      id: 'tissueInvasion',
      title: 'Weefselinvasie',
      nextStepOnAnswer: true,
      options: [
        {
          label: 'Geen',
          value: 'local',
        },
        {
          label:
            'Koorts en/of algehele malaise en/of (koude) rillingen en/of flank- of perineumpijn (pyelonefritis/prostatitis) en/of een delier',
          value: 'tissueInvasion',
        },
      ],
      required: true,
      multiple: false,
      model: '',
    },
    {
      type: 'multiplechoice',
      id: 'riskAssessment',
      title: 'Behoort patiënt tot een risicogroep?',
      nextStepOnAnswer: true,
      options: [
        {
          label: 'Nee',
          value: 'healthy',
        },
        {
          label: 'Diabetes mellitus of een verminderde weerstand',
          value: 'vulnerable',
        },
        {
          label:
            'Patiënten met afwijkingen aan de nieren of urinewegen (zoals ernstige nierfunctiestoornissen (eGFR < 30 ml/min/1,73 m2), cystenieren, nierstenen, een neurogene blaas, een bemoeilijkte mictie of bekend blaasresidu)',
          value: 'vulnerable',
        },
        {
          label: 'Patiënten met neurologische blaasfunctiestoornissen',
          value: 'vulnerable',
        },
        {
          label: 'Kwetsbare ouderen',
          value: 'elderly',
        },
        {
          label: 'Zwangeren',
          value: 'pregnant',
        },
        {
          label: 'Mannen',
          value: 'men',
        },
        {
          label: 'Kinderen',
          value: 'children',
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
        const store = useStore();
        const [tissueInvasion, riskAssessment] = questions;

        if (
          tissueInvasion.model === 'tissueInvasion' &&
          riskAssessment.model === 'pregnant'
        ) {
          store.setPath('uti.tissueInvasion.pregnant.0');

          return '_submit';
        }

        if (riskAssessment.model === 'elderly') {
          if (tissueInvasion.model === 'tissueInvasion') return 'sex';

          return 'elderly';
        }

        // Next question
        return 'urinaryCatheter';
      },
      required: true,
      multiple: false,
      model: '',
    },
    {
      type: 'multiplechoice',
      id: 'elderly',
      title: 'Is er sprake van',
      nextStepOnAnswer: true,
      options: [
        {
          label: 'Twee of meer van urineweggerelateerde symptomen',
          value: 'two',
        },
        {
          label:
            'Één zeer hinderlijk urineweggerelateerd symptoom waarvoor geen andere verklaring kan worden gevonden',
          value: 'one',
        },
        {
          label: 'Andere symptomen',
          value: 'none',
        },
      ],
      description:
        'Urineweggerelateerde symptomen: dysurie (pijn bij het plassen), (loze) mictiedrang, frequente mictie, urine-incontinentie, (zichtbare) urethrale pusafscheiding',
      jump: () => {
        const store = useStore();
        const [tissueInvasion, _, elederly] = questions;

        if (tissueInvasion.model === 'local' && elederly.model === 'none') {
          store.setPath('uti.local.elderly.0');

          return '_submit';
        }

        // Next question
        return 'sex';
      },
      required: true,
      multiple: false,
      model: '',
    },
    {
      type: 'multiplechoice',
      id: 'sex',
      title: 'Gaat het om een man of een vrouw',
      nextStepOnAnswer: true,
      options: [
        {
          label: 'Man',
          value: 'male',
        },
        {
          label: 'Vrouw',
          value: 'female',
        },
      ],
      required: true,
      multiple: false,
      model: '',
    },
    {
      type: 'multiplechoice',
      id: 'urinaryCatheter',
      title: 'Heeft patiënt een urine katheter?',
      nextStepOnAnswer: true,
      options: [
        {
          label: 'Ja',
          value: 'yes',
        },
        {
          label: 'Nee',
          value: 'no',
        },
      ],
      jump: () => {
        const store = useStore();
        const [
          tissueInvasion,
          riskAssessment,
          _,
          sex,
          urinaryCatheter,
          antibiotics,
        ] = questions;

        if (
          tissueInvasion.model === 'local' &&
          riskAssessment.model !== 'pregnant' &&
          urinaryCatheter.model === 'yes'
        ) {
          store.setPath('uti.local.cadMen.0');

          return '_submit';
        }

        const type = tissueInvasion.model as Type;
        let group = riskAssessment.model as Group;

        if (sex.model === 'male') group = 'men';
        if (sex.model === 'female') group = 'vulnerable';

        antibiotics.options = data[`uti.${type}.${group}`].treatment.map(
          (option, index) => {
            let name = option.description.split(',')[0];

            return {
              label: name,
              value: `${index}`,
            };
          }
        );

        // Next question!
      },
      required: true,
      multiple: false,
      model: '',
    },
    {
      type: 'multiplechoice',
      id: 'antibiotics',
      title: 'Welke behandeling kan patiënt krijgen',
      nextStepOnAnswer: true,
      options: [],
      jump: () => {
        const store = useStore();
        const [tissueInvasion, riskAssessment, _, sex, __, antibiotics] =
          questions;

        const ti = tissueInvasion.model as Type;
        let ra = riskAssessment.model as Group;
        const ab = antibiotics.model as Choice;

        if (sex.model === 'male') ra = 'men';
        if (sex.model === 'female') ra = 'vulnerable';

        store.setPath(`uti.${ti}.${ra}.${ab}`);
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
    name="Urineweginfectie"
    :questions="questions"
    @complete="navigate" />
</template>
