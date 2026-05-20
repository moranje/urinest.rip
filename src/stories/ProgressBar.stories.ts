import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ProgressBar from "../components/primitives/ProgressBar.vue";

const meta = {
  title: "Primitives/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
  argTypes: {
    value: { control: { type: "number", min: 0 } },
    max: { control: { type: "number", min: 1 } },
    label: { control: "text" },
    showText: { control: "boolean" },
  },
  args: {
    value: 3,
    max: 7,
    label: "Vraag voortgang",
    showText: true,
  },
  render: (args) => ({
    components: { ProgressBar },
    setup: () => ({ args }),
    template: `<div style="max-width:420px"><ProgressBar v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { value: 0, max: 7 },
};

export const Halfway: Story = {
  args: { value: 4, max: 8 },
};

export const Complete: Story = {
  args: { value: 7, max: 7 },
};

export const WithoutText: Story = {
  args: { showText: false },
};

export const ClampedOverMax: Story = {
  args: { value: 99, max: 5 },
};
