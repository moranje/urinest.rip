import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import axe from "axe-core";
import ActionRow from "./ActionRow.vue";
import Button from "./Button.vue";
import Badge from "./Badge.vue";
import ProgressBar from "./ProgressBar.vue";
import Card from "./Card.vue";
import Checkbox from "./Checkbox.vue";
import IconButton from "./IconButton.vue";
import Input from "./Input.vue";
import Radio from "./Radio.vue";
import Select from "./Select.vue";
import Tooltip from "./Tooltip.vue";
import FormField from "../molecules/FormField.vue";
import SegmentedControl from "../molecules/SegmentedControl.vue";

interface AxeResult {
  violations: Array<{ id: string; impact?: string; description: string }>;
}

const AXE_TEST_TIMEOUT_MS = 15_000;

async function runAxe(html: string): Promise<AxeResult> {
  // wrap in a landmark so axe doesn't flag the missing region
  const container = document.createElement("main");
  container.id = "axe-test-root";
  container.innerHTML = html;
  document.body.appendChild(container);
  try {
    const result = (await axe.run(container, {
      runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
    })) as AxeResult;
    return result;
  } finally {
    document.body.removeChild(container);
  }
}

describe("Primitive components — axe smoke", () => {
  it(
    "ActionRow has no violations",
    async () => {
      const wrapper = mount(ActionRow, {
        slots: { default: "Open loggroep" },
        attachTo: document.body,
      });
      const result = await runAxe(wrapper.html());
      expect(result.violations.map((v) => v.id)).toEqual([]);
      wrapper.unmount();
    },
    AXE_TEST_TIMEOUT_MS,
  );

  it(
    "Button has no a11y violations",
    async () => {
      const wrapper = mount(Button, { slots: { default: "Save" }, attachTo: document.body });
      const result = await runAxe(wrapper.html());
      expect(result.violations.map((v) => v.id)).toEqual([]);
      wrapper.unmount();
    },
    AXE_TEST_TIMEOUT_MS,
  );

  it(
    "Badge with aria-label has no violations",
    async () => {
      const wrapper = mount(Badge, {
        props: { variant: "u1", role: "status", ariaLabel: "Spoed" },
        slots: { default: "U1" },
        attachTo: document.body,
      });
      const result = await runAxe(wrapper.html());
      expect(result.violations.map((v) => v.id)).toEqual([]);
      wrapper.unmount();
    },
    AXE_TEST_TIMEOUT_MS,
  );

  it(
    "ProgressBar has no violations",
    async () => {
      const wrapper = mount(ProgressBar, {
        props: { value: 1, max: 5, label: "Stap 1 van 5" },
        attachTo: document.body,
      });
      const result = await runAxe(wrapper.html());
      expect(result.violations.map((v) => v.id)).toEqual([]);
      wrapper.unmount();
    },
    AXE_TEST_TIMEOUT_MS,
  );

  it(
    "Card with children has no violations",
    async () => {
      const wrapper = mount(Card, {
        slots: { default: "<p>Voorbeeld</p>" },
        attachTo: document.body,
      });
      const result = await runAxe(wrapper.html());
      expect(result.violations.map((v) => v.id)).toEqual([]);
      wrapper.unmount();
    },
    AXE_TEST_TIMEOUT_MS,
  );

  it(
    "Form controls have no violations",
    async () => {
      const wrapper = mount(
        {
          components: {
            Checkbox,
            FormField,
            IconButton,
            Input,
            Radio,
            SegmentedControl,
            Select,
            Tooltip,
          },
          template: `
          <form>
            <IconButton icon="settings" aria-label="Instellingen" />
            <FormField id="query" label="Zoeken" hint="Gebruik ten minste drie letters">
              <template #default="{ fieldId, describedBy }">
                <input :id="fieldId" :aria-describedby="describedBy" />
              </template>
            </FormField>
            <SegmentedControl
              label="Rol"
              model-value="arts"
              :options="[{ value: 'arts', label: 'Arts' }, { value: 'triage', label: 'Triage' }]"
            />
            <Input id="email" label="E-mail" model-value="" autocomplete="email" />
            <Select
              id="role"
              label="Rol"
              model-value="arts"
              :options="[{ value: 'arts', label: 'Arts' }, { value: 'poh', label: 'POH' }]"
            />
            <Checkbox id="confirm" label="Gecontroleerd" />
            <Radio id="role-arts" name="role-radio" value="arts" model-value="arts" label="Arts" />
            <Tooltip id="tip">Toelichting</Tooltip>
          </form>
        `,
        },
        { attachTo: document.body },
      );
      const result = await runAxe(wrapper.html());
      expect(result.violations.map((v) => v.id)).toEqual([]);
      wrapper.unmount();
    },
    AXE_TEST_TIMEOUT_MS,
  );
});
