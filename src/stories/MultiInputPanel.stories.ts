import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MultiInputPanel from "../components/organisms/MultiInputPanel.vue";
import type { Answer, Question } from "../types";

const cvrmQuestions: Question[] = [
  {
    id: "q_age",
    text: "Leeftijd",
    type: "number",
    description: "Jaren op het moment van risicoschatting.",
    options: [],
  },
  {
    id: "q_sex",
    text: "Geslacht volgens calculatorinvoer",
    type: "select",
    options: [
      { id: "o_male", value: "M", text: "Man" },
      { id: "o_female", value: "F", text: "Vrouw" },
    ],
  },
  {
    id: "q_smoking",
    text: "Rookt de patient nu?",
    type: "boolean",
    options: [],
  },
  {
    id: "q_sbp",
    text: "Systolische bloeddruk",
    type: "number",
    description: "Gebruik bij voorkeur een representatieve spreekkamermeting.",
    options: [],
  },
  {
    id: "q_total_cholesterol",
    text: "Totaal cholesterol",
    type: "number",
    options: [],
  },
  {
    id: "q_hdl",
    text: "HDL-cholesterol",
    type: "number",
    options: [],
  },
];

const longQuestions: Question[] = [
  {
    id: "q_responsibility",
    text: "Mag deze rol op basis van de beschikbare gegevens zelfstandig een behandeladvies afronden?",
    type: "select",
    description:
      "Gebruik dit alleen wanneer het lokale protocol de taak expliciet aan deze rol toewijst.",
    options: [
      {
        id: "o_yes",
        value: "yes",
        text: "Ja, volgens lokaal protocol en met voldoende context",
      },
      {
        id: "o_no",
        value: "no",
        text: "Nee, overleg met huisarts of regiebehandelaar nodig",
      },
    ],
  },
  ...cvrmQuestions,
];

const completeAnswers: Record<string, Answer> = {
  q_age: { value: "68", text: "68" },
  q_sex: { value: "F", text: "Vrouw" },
  q_smoking: { value: "false", text: "Nee" },
  q_sbp: { value: "145", text: "145" },
  q_total_cholesterol: { value: "5.5", text: "5.5" },
  q_hdl: { value: "1.2", text: "1.2" },
};

const meta = {
  title: "Organisms/MultiInputPanel",
  component: MultiInputPanel,
  tags: ["autodocs"],
  args: {
    answers: completeAnswers,
    canRestart: true,
    progressMax: 8,
    progressValue: 3,
    questions: cvrmQuestions,
    stepDescription: "Vul de waarden in die nodig zijn voor de risicoberekening.",
    title: "CVRM risicogegevens",
  },
  render: (args) => ({
    components: { MultiInputPanel },
    setup: () => ({ args }),
    template: `
      <div style="max-width:980px;">
        <MultiInputPanel v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof MultiInputPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CvrmInputs: Story = {};

export const Incomplete: Story = {
  args: {
    answers: {
      q_age: { value: "68", text: "68" },
    },
  },
};

export const LongClinicalLabels: Story = {
  args: {
    answers: completeAnswers,
    questions: longQuestions,
    title: "CVRM intake met rolverantwoordelijkheid",
  },
};
