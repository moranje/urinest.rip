import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Toast from "../components/molecules/Toast.vue";

const meta = {
  title: "Molecules/Toast",
  component: Toast,
  tags: ["autodocs"],
  argTypes: {
    level: {
      control: { type: "select" },
      options: ["info", "success", "warning", "error"],
    },
    dismissible: { control: "boolean" },
  },
  args: {
    level: "info",
    message: "Wijziging opgeslagen.",
    dismissible: true,
  },
  render: (args) => ({
    components: { Toast },
    setup: () => ({ args }),
    template: `<Toast v-bind="args" style="max-width: 420px;" />`,
  }),
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllLevels: Story = {
  render: () => ({
    components: { Toast },
    template: `
      <div style="display:grid; gap:12px; max-width:420px;">
        <Toast level="info" message="Nieuwe toelichting beschikbaar." />
        <Toast level="success" message="Gekopieerd naar het klembord." />
        <Toast level="warning" message="Controleer contra-indicaties voordat behandeling wordt getoond." />
        <Toast level="error" message="De vragenlijst kon niet worden geladen." />
      </div>
    `,
  }),
};

export const LongText: Story = {
  args: {
    level: "warning",
    message:
      "Deze melding bevat bewust langere klinische tekst zodat afbreken, padding en sluitknoppositie in smalle containers zichtbaar blijven.",
  },
};
