import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Button from "../components/primitives/Button.vue";

const meta = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["primary", "outlined", "text"],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
    type: {
      control: { type: "select" },
      options: ["button", "submit", "reset"],
    },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
  args: {
    variant: "primary",
    size: "md",
    type: "button",
    disabled: false,
    loading: false,
    fullWidth: false,
  },
  render: (args) => ({
    components: { Button },
    setup: () => ({ args }),
    template: `<Button v-bind="args">Volgende vraag</Button>`,
  }),
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Outlined: Story = {
  args: { variant: "outlined" },
};

export const Text: Story = {
  args: { variant: "text" },
};

export const Small: Story = {
  args: { variant: "primary", size: "sm" },
};

export const Large: Story = {
  args: { variant: "primary", size: "lg" },
};

export const Loading: Story = {
  args: { variant: "primary", loading: true },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true },
};

export const FullWidth: Story = {
  args: { variant: "primary", fullWidth: true },
};

export const AllVariants: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
        <Button variant="primary">Primary</Button>
        <Button variant="outlined">Outlined</Button>
        <Button variant="text">Text</Button>
        <Button variant="primary" disabled>Disabled</Button>
        <Button variant="primary" loading>Loading</Button>
      </div>
    `,
  }),
};
