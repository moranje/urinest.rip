import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Chip from "../components/primitives/Chip.vue";

const meta = {
  title: "Primitives/Chip",
  component: Chip,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["filled", "outlined"],
    },
    icon: { control: "text" },
    href: { control: "text" },
  },
  args: {
    variant: "filled",
    icon: "file-text",
  },
  render: (args) => ({
    components: { Chip },
    setup: () => ({ args }),
    template: `<Chip v-bind="args">NHG-Standaard Urineweginfecties</Chip>`,
  }),
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  args: {
    variant: "filled",
  },
};

export const ExternalLink: Story = {
  args: {
    variant: "outlined",
    href: "https://example.test/richtlijn",
  },
};

export const LongText: Story = {
  args: {
    variant: "outlined",
  },
  render: (args) => ({
    components: { Chip },
    setup: () => ({ args }),
    template: `
      <div style="max-width:240px;">
        <Chip v-bind="args">
          Zeer lange bronvermelding met hoofdstuk, paragraaf en revisiedatum
        </Chip>
      </div>
    `,
  }),
};
