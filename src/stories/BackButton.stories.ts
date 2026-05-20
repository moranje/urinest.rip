import type { Meta, StoryObj } from "@storybook/vue3-vite";
import BackButton from "../components/primitives/BackButton.vue";

const meta = {
  title: "Primitives/BackButton",
  component: BackButton,
  tags: ["autodocs"],
  argTypes: {
    ariaLabel: { control: "text" },
  },
  args: {
    ariaLabel: "Terug",
  },
  render: (args) => ({
    components: { BackButton },
    setup: () => ({ args }),
    template: `<BackButton v-bind="args" @click="onClick" />`,
    methods: {
      onClick(): void {
        // Action logged in Storybook
      },
    },
  }),
} satisfies Meta<typeof BackButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = {
  render: () => ({
    components: { BackButton },
    template: `<BackButton aria-label="Vorige vraag">Vorige vraag</BackButton>`,
  }),
};
