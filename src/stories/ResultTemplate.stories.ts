import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ResultTemplate from "../components/templates/ResultTemplate.vue";
import type { ResultData } from "../types";

const result: ResultData = {
  title: "Nitrofurantoine (1e keuze)",
  description: "Behandeling wordt getoond na controle van contra-indicaties.",
  urgency: "u3",
  treatment: "Nitrofurantoine 5 dagen volgens NHG-Standaard, controleer contra-indicaties.",
  warnings: "Bij eGFR 30-50 ml/min: doseringsaanpassing, raadpleeg Farmacotherapeutisch Kompas.",
  contraindications: [
    { id: "egfr", text: "eGFR < 30 ml/min" },
    { id: "g6pd", text: "G6PD-deficientie" },
    { id: "pregnancy-term", text: "Zwangerschapsduur vanaf 36 weken" },
  ],
  explainer:
    "Leg uit dat klachten meestal binnen enkele dagen verbeteren. Geef instructies wanneer opnieuw contact nodig is.",
  documentation:
    "Nitrofurantoine voorgeschreven. Contra-indicaties gecontroleerd. Instructies en alarmsymptomen besproken.",
  additionalTests: "Kweek bij falen van behandeling of recidief volgens lokale afspraken.",
  testAfterTreatment: "Controle bij persisterende klachten na behandeling.",
  sources: [
    {
      name: "NHG-Standaard Urineweginfecties",
      url: "https://richtlijnen.nhg.org/standaarden/urineweginfecties",
    },
    {
      name: "Farmacotherapeutisch Kompas",
      url: "https://www.farmacotherapeutischkompas.nl/",
    },
  ],
};

const meta = {
  title: "Templates/ResultTemplate",
  component: ResultTemplate,
  tags: ["autodocs"],
  args: {
    isLoading: false,
    error: null,
    result,
    documentation: result.documentation,
  },
  argTypes: {
    isLoading: { control: "boolean" },
    error: { control: "text" },
  },
  render: (args) => ({
    components: { ResultTemplate },
    setup: () => ({ args }),
    template: `<ResultTemplate v-bind="args" />`,
  }),
} satisfies Meta<typeof ResultTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TreatmentResult: Story = {};

export const Loading: Story = {
  args: {
    isLoading: true,
    result: null,
  },
};

export const ErrorState: Story = {
  args: {
    result: null,
    error: "Resultaat niet gevonden. Controleer de route of start de vragenlijst opnieuw.",
  },
};

export const LongClinicalCopy: Story = {
  args: {
    result: {
      ...result,
      title: "Controle nodig voordat beleid zichtbaar wordt",
      explainer:
        "Deze resultaatkaart bevat langere Nederlandse klinische uitleg. De tekst moet leesbaar blijven, niet tegen randen lopen en bronverwijzingen moeten scanbaar blijven voor huisarts, triagist en verpleegkundige.",
      documentation:
        "Langere EPD-tekst met gekozen beleid, contra-indicaties, beleid bij alarmsymptomen, vangnetadvies en bronverwijzing. Controleer of kopieeractie en layout bruikbaar blijven.",
    },
  },
};
