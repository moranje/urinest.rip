import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ActionRow from "../components/primitives/ActionRow.vue";
import Badge from "../components/primitives/Badge.vue";

const meta = {
  title: "Primitives/ActionRow",
  component: ActionRow,
  tags: ["autodocs"],
  render: (args) => ({
    components: { ActionRow, Badge },
    setup: () => ({ args }),
    template: `
      <ActionRow v-bind="args">
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <Badge variant="error" size="sm">ERROR</Badge>
          <strong>Transition was skipped</strong>
          <span style="margin-left:auto;">x3</span>
        </div>
        <small>Laatst: 1 min geleden · Eerst: 1 uur geleden</small>
      </ActionRow>
    `,
  }),
} satisfies Meta<typeof ActionRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const LongText: Story = {
  render: (args) => ({
    components: { ActionRow, Badge },
    setup: () => ({ args }),
    template: `
      <ActionRow v-bind="args">
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <Badge variant="warn" size="sm">WARN</Badge>
          <strong>Log persistence disabled after repeated unauthorized responses</strong>
        </div>
        <small>Deze rij blijft leesbaar bij langere meldingen en kleinere containers.</small>
      </ActionRow>
    `,
  }),
};
