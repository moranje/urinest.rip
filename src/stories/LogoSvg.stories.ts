import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogoSvg from "../components/LogoSvg.vue";

const meta = {
  title: "Primitives/LogoSvg",
  component: LogoSvg,
  tags: ["autodocs"],
  argTypes: {
    size: { control: { type: "number", min: 16, max: 96 } },
    animate: { control: "boolean" },
  },
  args: {
    size: 40,
    animate: false,
  },
  render: (args) => ({
    components: { LogoSvg },
    setup: () => ({ args }),
    template: `
      <div style="display:inline-flex;align-items:center;padding:16px;background:var(--md-sys-color-surface);">
        <LogoSvg v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof LogoSvg>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HeaderSize: Story = {
  args: { size: 32 },
};

export const Animated: Story = {
  args: { animate: true },
};
