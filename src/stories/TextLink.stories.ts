import type { Meta, StoryObj } from "@storybook/vue3-vite";
import TextLink from "../components/primitives/TextLink.vue";

const meta = {
  title: "Primitives/TextLink",
  component: TextLink,
  tags: ["autodocs"],
  argTypes: {
    href: { control: "text" },
    external: { control: "boolean" },
    target: {
      control: { type: "select" },
      options: [undefined, "_blank", "_self", "_parent", "_top"],
    },
  },
  args: {
    href: "https://richtlijnen.nhg.org/standaarden/urineweginfecties",
  },
  render: (args) => ({
    components: { TextLink },
    setup: () => ({ args }),
    template: `<TextLink v-bind="args">NHG-Standaard Urineweginfecties</TextLink>`,
  }),
} satisfies Meta<typeof TextLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const External: Story = {};

export const Internal: Story = {
  args: {
    href: "/over",
  },
};

export const LongText: Story = {
  render: (args) => ({
    components: { TextLink },
    setup: () => ({ args }),
    template: `
      <p style="max-width:280px;">
        <TextLink v-bind="args">
          Zeer lange richtlijnverwijzing met hoofdstuk, paragraaf, revisiedatum en organisatie
        </TextLink>
      </p>
    `,
  }),
};
