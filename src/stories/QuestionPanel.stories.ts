import type { Meta, StoryObj } from "@storybook/vue3-vite";
import QuestionPanel from "../components/organisms/QuestionPanel.vue";
import type { Question } from "../types";

const treatmentQuestion: Question = {
  id: "q_treatment",
  text: "Welke behandeling kan patient krijgen?",
  type: "select",
  description:
    "Kies pas na controle van contra-indicaties. Gebruik info-knoppen voor korte toelichting per keuze.",
  options: [
    {
      id: "o_wait",
      value: "wait",
      text: "Afwachtend beleid (eventueel met pijnstilling)",
    },
    {
      id: "o_nitro",
      value: "nitro",
      text: "Nitrofurantoine (1e keuze)",
      description: "Controleer eGFR, G6PD-deficientie en zwangerschapstermijn.",
    },
    {
      id: "o_fosfo",
      value: "fosfo",
      text: "Fosfomycine (2e keuze)",
      description: "Controleer allergieen en lokale afspraken.",
    },
    {
      id: "o_trim",
      value: "trim",
      text: "Trimethoprim (3e keuze)",
      description: "Niet gebruiken bij zwangerschap zonder overleg.",
    },
  ],
};

const longQuestion: Question = {
  ...treatmentQuestion,
  id: "q_long",
  text: "Zijn er alarmsymptomen, kwetsbaarheidsfactoren of redenen waarom deze route niet zelfstandig door deze rol mag worden afgerond?",
  options: treatmentQuestion.options.map((option) => ({
    ...option,
    text:
      option.id === "o_wait"
        ? "Nee, er zijn geen alarmsymptomen en er is genoeg context om deze route veilig af te ronden"
        : option.text,
  })),
};

const meta = {
  title: "Organisms/QuestionPanel",
  component: QuestionPanel,
  tags: ["autodocs"],
  args: {
    question: treatmentQuestion,
    stepDescription: "",
    descriptionHtml:
      "<p>Nitriet wordt gevormd door bacterien die nitraat omzetten. Een positieve test wijst op bacteriurie.</p>",
    canRestart: true,
    progressValue: 2,
    progressMax: 5,
    progressLabel: "Indicatieve voortgang",
    progressText: "",
    selectedOptionIds: [],
    selectedCount: 0,
    hasSelectedOptions: false,
    multiSelect: false,
    nonTouch: true,
    activePopoverOptionId: null,
  },
  render: (args) => ({
    components: { QuestionPanel },
    setup: () => ({ args }),
    template: `
      <div style="max-width:980px;">
        <QuestionPanel v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof QuestionPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleSelect: Story = {};

export const WithSelectedOption: Story = {
  args: {
    selectedOptionIds: ["o_nitro"],
    hasSelectedOptions: true,
  },
};

export const MultiSelectLongCopy: Story = {
  args: {
    question: longQuestion,
    multiSelect: true,
    selectedOptionIds: ["o_wait", "o_fosfo"],
    selectedCount: 2,
    hasSelectedOptions: true,
    progressValue: 3,
    progressMax: 5,
  },
};
