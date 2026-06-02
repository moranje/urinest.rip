import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Checkbox from "../components/primitives/Checkbox.vue";
import Icon from "../components/primitives/Icon.vue";
import IconButton from "../components/primitives/IconButton.vue";
import Input from "../components/primitives/Input.vue";
import Radio from "../components/primitives/Radio.vue";
import Select from "../components/primitives/Select.vue";
import Tooltip from "../components/primitives/Tooltip.vue";

const selectOptions = [
  { value: "triage", label: "Triage" },
  { value: "behandelaar", label: "Behandelaar" },
  { value: "poh", label: "Praktijkondersteuner somatiek" },
] as const;

const meta = {
  title: "Primitives/FormControls",
  tags: ["autodocs"],
  render: () => ({
    components: { Checkbox, Icon, IconButton, Input, Radio, Select, Tooltip },
    setup() {
      const textValue = ref("Klachten bestaan sinds drie dagen");
      const numberValue = ref("3");
      const selectValue = ref("triage");
      const checkboxValue = ref(true);
      const radioValue = ref("triage");
      return {
        checkboxValue,
        numberValue,
        radioValue,
        selectOptions,
        selectValue,
        textValue,
      };
    },
    template: `
      <div style="display:grid; gap:24px; max-width:860px;">
        <section style="display:grid; gap:16px;">
          <Input
            v-model="textValue"
            label="Samenvatting"
            hint="Korte, klinisch bruikbare tekst zonder persoonsgegevens."
            name="summary"
          />
          <Input
            v-model="numberValue"
            label="Aantal dagen klachten"
            type="number"
            error="Gebruik een geheel getal vanaf 0."
            name="duration"
          />
          <Select
            v-model="selectValue"
            label="Rol"
            name="role"
            hint="Lange labels moeten zonder clipping afbreken."
            :options="selectOptions"
          />
        </section>
        <section style="display:grid; gap:12px;">
          <Checkbox
            v-model="checkboxValue"
            label="Vangnetadvies besproken"
            description="Inclusief alarmsymptomen, opnieuw contact opnemen en beleid bij verslechtering."
            name="safety-net"
          />
          <Radio
            v-model="radioValue"
            value="triage"
            label="Triage"
            description="Vragen en vervolgactie passend bij doktersassistent of triagist."
            name="role-radio"
          />
          <Radio
            v-model="radioValue"
            value="behandelaar"
            label="Behandelaar"
            description="Behandelopties, contra-indicaties en documentatie."
            name="role-radio"
          />
        </section>
        <section style="display:flex; flex-wrap:wrap; align-items:center; gap:12px;">
          <Icon name="activity" :size="24" title="Activiteit" />
          <Icon name="spinner" :size="24" spin title="Laden" />
          <IconButton icon="info-circle" aria-label="Toon informatie" variant="standard" />
          <IconButton icon="restart" aria-label="Start opnieuw" variant="outlined" />
          <IconButton icon="download" aria-label="Download documentatie" variant="tonal" />
          <Tooltip aria-label="Broninformatie">
            Iedere vraag krijgt een bronverdediging en korte toelichting wanneer context nodig is.
          </Tooltip>
        </section>
      </div>
    `,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inputs: Story = {
  render: () => ({
    components: { Input, Select },
    setup() {
      const textValue = ref("Afspraak gemaakt voor controle urinekweek");
      const numberValue = ref("2");
      const selectValue = ref("poh");
      return { numberValue, selectOptions, selectValue, textValue };
    },
    template: `
      <div style="display:grid; gap:16px; max-width:760px;">
        <Input
          v-model="textValue"
          label="Actie"
          hint="Ondersteunende tekst gebruikt body-small tokens."
          name="action"
        />
        <Input
          v-model="numberValue"
          label="Controle na aantal dagen"
          type="number"
          name="follow-up-days"
        />
        <Select
          v-model="selectValue"
          label="Verantwoordelijke"
          placeholder="Kies rol"
          :options="selectOptions"
          name="owner"
        />
      </div>
    `,
  }),
};

export const SelectionControls: Story = {
  render: () => ({
    components: { Checkbox, Radio },
    setup() {
      const checkboxValue = ref(true);
      const radioValue = ref("behandelaar");
      return { checkboxValue, radioValue };
    },
    template: `
      <div style="display:grid; gap:12px; max-width:760px;">
        <Checkbox
          v-model="checkboxValue"
          label="Bronnen gecontroleerd"
          description="Vraag, optie en resultaat moeten terug te voeren zijn op richtlijntekst of expliciete lokale afspraak."
          name="sources-checked"
        />
        <Radio
          v-model="radioValue"
          value="triage"
          label="Triage"
          description="Beperk tot informatie die binnen deze verantwoordelijkheid veilig is."
          name="selection-role"
        />
        <Radio
          v-model="radioValue"
          value="behandelaar"
          label="Behandelaar"
          description="Toon behandelbeleid, contra-indicaties, doseringen en EPD-tekst."
          name="selection-role"
        />
      </div>
    `,
  }),
};

export const IconButtonsAndTooltip: Story = {
  render: () => ({
    components: { Icon, IconButton, Tooltip },
    template: `
      <div style="display:flex; flex-wrap:wrap; align-items:center; gap:12px;">
        <Icon name="check-circle" :size="24" title="Voltooid" />
        <Icon name="warning-circle" :size="24" title="Let op" />
        <IconButton icon="copy" aria-label="Kopieer naar EPD" variant="filled" />
        <IconButton icon="settings" aria-label="Instellingen" variant="outlined" />
        <Tooltip aria-label="Waarom deze vraag?">
          De toelichting verklaart alleen de klinische noodzaak en bronkoppeling.
        </Tooltip>
      </div>
    `,
  }),
};

export const AllControls: Story = {};
