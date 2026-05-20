import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Card from "../components/primitives/Card.vue";

const meta = {
  title: "Primitives/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["plain", "elevated", "outlined", "accent"],
    },
  },
  args: {
    variant: "plain",
  },
  render: (args) => ({
    components: { Card },
    setup: () => ({ args }),
    template: `
      <Card v-bind="args" style="max-width:360px">
        <h3 style="margin:0 0 8px 0">Behandeladvies</h3>
        <p style="margin:0">Nitrofurantoïne 100 mg 2dd1 gedurende 5 dagen.</p>
      </Card>
    `,
  }),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {
  args: { variant: "plain" },
};

export const Elevated: Story = {
  args: { variant: "elevated" },
};

export const Outlined: Story = {
  args: { variant: "outlined" },
};

export const Accent: Story = {
  args: { variant: "accent" },
};

export const AllVariants: Story = {
  render: () => ({
    components: { Card },
    template: `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px;">
        <Card variant="plain"><strong>Plain</strong><p>Standaardkaart zonder accent.</p></Card>
        <Card variant="elevated"><strong>Elevated</strong><p>Met schaduw voor lichte lift.</p></Card>
        <Card variant="outlined"><strong>Outlined</strong><p>Met outline-variant rand.</p></Card>
        <Card variant="accent"><strong>Accent</strong><p>Voor behandeling-secties (border-left).</p></Card>
      </div>
    `,
  }),
};
