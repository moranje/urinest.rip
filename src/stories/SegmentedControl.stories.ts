import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SegmentedControl from "../components/molecules/SegmentedControl.vue";

const roleOptions = [
  { value: "behandelaar", label: "Arts", ariaLabel: "Behandelaar" },
  { value: "triage", label: "Triage", ariaLabel: "Triage" },
] as const;

const meta = {
  title: "Molecules/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md"],
    },
    iconOnly: { control: "boolean" },
    wrapLabels: { control: "boolean" },
  },
  args: {
    modelValue: "behandelaar",
    options: roleOptions,
    label: "Rol",
    size: "md",
    iconOnly: false,
    wrapLabels: false,
  },
  render: (args) => ({
    components: { SegmentedControl },
    setup() {
      const value = ref(args.modelValue);
      return { args, value };
    },
    template: `
      <SegmentedControl
        v-bind="args"
        v-model="value"
      />
    `,
  }),
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RoleToggle: Story = {};

export const LongLabels: Story = {
  args: {
    modelValue: "doktersassistent",
    label: "Verantwoordelijkheid",
    wrapLabels: true,
    options: [
      { value: "doktersassistent", label: "Doktersassistent", ariaLabel: "Doktersassistent" },
      { value: "verpleegkundige", label: "Verpleegkundige", ariaLabel: "Verpleegkundige" },
      { value: "praktijkondersteuner", label: "Praktijkondersteuner", ariaLabel: "POH" },
    ],
  },
};
