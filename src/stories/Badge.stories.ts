import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Badge from "../components/primitives/Badge.vue";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["u1", "u2", "u3", "info", "success"],
    },
    role: { control: "text" },
    ariaLabel: { control: "text" },
    pulse: { control: "boolean" },
  },
  args: {
    variant: "info",
    pulse: false,
  },
  render: (args) => ({
    components: { Badge },
    setup: () => ({ args }),
    template: `<Badge v-bind="args">{{ label(args.variant) }}</Badge>`,
    methods: {
      label(variant: string): string {
        switch (variant) {
          case "u1":
            return "U1 Spoed";
          case "u2":
            return "U2 Snel";
          case "u3":
            return "U3 Routine";
          case "success":
            return "Compleet";
          default:
            return "Info";
        }
      },
    },
  }),
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = { args: { variant: "info" } };
export const U1Spoed: Story = {
  args: { variant: "u1", pulse: true, ariaLabel: "Spoed" },
};
export const U2: Story = { args: { variant: "u2" } };
export const U3: Story = { args: { variant: "u3" } };
export const Success: Story = { args: { variant: "success" } };

export const AllVariants: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
        <Badge variant="u1" pulse aria-label="Spoed">U1 Spoed</Badge>
        <Badge variant="u2">U2 Snel</Badge>
        <Badge variant="u3">U3 Routine</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="success">Compleet</Badge>
      </div>
    `,
  }),
};
