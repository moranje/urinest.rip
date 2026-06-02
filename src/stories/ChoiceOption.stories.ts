import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ChoiceOption from "../components/molecules/ChoiceOption.vue";
import type { QuestionOption } from "../types";

const option: QuestionOption = {
  id: "o_nitrofurantoin",
  value: "nitrofurantoin",
  text: "Nitrofurantoine (1e keuze)",
  description: "Controleer eGFR, zwangerschapstermijn en G6PD-deficientie.",
};

const longOption: QuestionOption = {
  id: "o_long",
  value: "long",
  text: "Afwachtend beleid met duidelijke instructies voor pijnstilling, alarmsymptomen en opnieuw contact opnemen bij achteruitgang",
  description: "Lange optie om regelafbreking, info-knoppositie en touch-targets te controleren.",
};

const meta = {
  title: "Molecules/ChoiceOption",
  component: ChoiceOption,
  tags: ["autodocs"],
  args: {
    option,
    index: 1,
    selected: false,
    multiSelect: false,
    nonTouch: true,
    tabIndex: 0,
    popoverOpen: false,
  },
  argTypes: {
    selected: { control: "boolean" },
    multiSelect: { control: "boolean" },
    nonTouch: { control: "boolean" },
    popoverOpen: { control: "boolean" },
  },
  render: (args) => ({
    components: { ChoiceOption },
    setup: () => ({ args }),
    template: `
      <div style="max-width:860px;">
        <ChoiceOption v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof ChoiceOption>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    selected: true,
  },
};

export const MultiSelect: Story = {
  args: {
    multiSelect: true,
    selected: true,
    index: 2,
  },
};

export const LongText: Story = {
  args: {
    option: longOption,
    index: 0,
  },
};

export const WithoutKeyboardPrefix: Story = {
  args: {
    nonTouch: false,
  },
};
