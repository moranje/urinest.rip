import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ActionRow from "../components/primitives/ActionRow.vue";
import StatusBadge from "../components/molecules/StatusBadge.vue";

const meta = {
  title: "Primitives/ActionRow",
  component: ActionRow,
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
  },
  args: {
    disabled: false,
  },
  render: (args) => ({
    components: { ActionRow, StatusBadge },
    setup: () => ({ args }),
    template: `
      <div style="max-width:680px;">
        <ActionRow v-bind="args">
          <span style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <StatusBadge variant="error">ERROR</StatusBadge>
            <strong>Transition was skipped</strong>
            <span style="color:var(--md-sys-color-on-surface-variant);">questionnaire</span>
          </span>
          <span style="color:var(--md-sys-color-outline);">Laatst: 2 min geleden</span>
        </ActionRow>
      </div>
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
    components: { ActionRow, StatusBadge },
    setup: () => ({ args }),
    template: `
      <div style="max-width:420px;">
        <ActionRow v-bind="args">
          <span style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <StatusBadge variant="warn">WARN</StatusBadge>
            <strong>
              Langere administratieve rijtitel met module, fingerprint en duidelijke context
            </strong>
          </span>
          <span style="color:var(--md-sys-color-outline);">
            Eerst gezien gisteren, laatst bijgewerkt zojuist
          </span>
        </ActionRow>
      </div>
    `,
  }),
};
