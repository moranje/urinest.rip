import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Button from "../components/primitives/Button.vue";
import Notice from "../components/molecules/Notice.vue";

const meta = {
  title: "Molecules/Notice",
  component: Notice,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["info", "warning", "error", "success"],
    },
    role: {
      control: { type: "select" },
      options: ["alert", "status", "note"],
    },
  },
  args: {
    variant: "info",
    title: "Controle nodig",
    role: "status",
  },
  render: (args) => ({
    components: { Notice },
    setup: () => ({ args }),
    template: `
      <Notice v-bind="args">
        Controleer contra-indicaties voordat behandeling wordt getoond.
      </Notice>
    `,
  }),
} satisfies Meta<typeof Notice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Waarschuwing",
    role: "alert",
  },
  render: (args) => ({
    components: { Notice },
    setup: () => ({ args }),
    template: `
      <Notice v-bind="args">
        Bij eGFR 30-50 ml/min: doseringsaanpassing, raadpleeg Farmacotherapeutisch Kompas.
      </Notice>
    `,
  }),
};

export const LongCopy: Story = {
  args: {
    variant: "info",
    title: "Langere toelichting",
  },
  render: (args) => ({
    components: { Button, Notice },
    setup: () => ({ args }),
    template: `
      <Notice v-bind="args">
        <p>
          Deze melding bevat langere tekst, bronverwijzingstaal en ruimte voor nuance zonder dat
          inhoud tegen randen plakt of visueel als knop voelt.
        </p>
        <template #action>
          <Button variant="outlined" size="sm">Bron bekijken</Button>
        </template>
      </Notice>
    `,
  }),
};

export const AllVariants: Story = {
  render: () => ({
    components: { Notice },
    template: `
      <div style="display:grid; gap:16px; max-width:760px;">
        <Notice variant="info" title="Controle nodig">Controleer alle contra-indicaties.</Notice>
        <Notice variant="warning" title="Waarschuwing" role="alert">Behandeladvies vraagt klinische beoordeling.</Notice>
        <Notice variant="error" title="Niet veilig" role="alert">Deze route mag geen behandeladvies tonen.</Notice>
        <Notice variant="success" title="Afgerond">Alle noodzakelijke controles zijn gedaan.</Notice>
      </div>
    `,
  }),
};
