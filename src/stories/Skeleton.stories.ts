import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Skeleton from "../components/primitives/Skeleton.vue";

const meta = {
  title: "Primitives/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["line", "title", "short", "option", "badge"],
    },
    width: { control: "text" },
    height: { control: "text" },
  },
  args: {
    variant: "line",
  },
  render: (args) => ({
    components: { Skeleton },
    setup: () => ({ args }),
    template: `<div style="max-width:420px"><Skeleton v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = { args: { variant: "line" } };
export const Title: Story = { args: { variant: "title" } };
export const Short: Story = { args: { variant: "short" } };
export const Option: Story = { args: { variant: "option" } };
export const BadgeShape: Story = { args: { variant: "badge" } };

export const QuestionPlaceholder: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div style="max-width:420px">
        <Skeleton variant="badge" />
        <Skeleton variant="title" />
        <Skeleton variant="line" />
        <Skeleton variant="line" />
        <Skeleton variant="short" />
        <div style="height:16px"></div>
        <Skeleton variant="option" />
        <div style="height:8px"></div>
        <Skeleton variant="option" />
        <div style="height:8px"></div>
        <Skeleton variant="option" />
      </div>
    `,
  }),
};
