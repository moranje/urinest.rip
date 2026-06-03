import { h, type Component } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { setup, type Meta, type StoryObj } from "@storybook/vue3-vite";
import LandingTemplate from "../components/templates/LandingTemplate.vue";
import type { BeslismodelLandingMenuSource } from "@beslismodel/vue";

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: "/:pathMatch(.*)*", component: { template: "<main />" } }],
});

setup((app) => {
  app.use(router);
});

const primaryItems: BeslismodelLandingMenuSource[] = [
  {
    id: "gezonde-vrouwen",
    title: "Gezonde vrouwen",
    icon: "healthy",
    metadata: { landingOrder: 10, landingSection: "primary" },
  },
  {
    id: "strip",
    title: "Urinestrip",
    icon: "strip",
    metadata: { landingOrder: 20, landingSection: "primary" },
  },
  {
    id: "dipslide",
    title: "Dipslide",
    icon: "dipslide",
    metadata: { landingOrder: 30, landingSection: "primary" },
  },
  {
    id: "sediment",
    title: "Sediment",
    icon: "sediment",
    metadata: { landingOrder: 40, landingSection: "primary" },
  },
  {
    id: "kweek",
    title: "Kweek",
    icon: "culture",
    metadata: { landingOrder: 50, landingSection: "primary" },
  },
];

const secondaryItems: BeslismodelLandingMenuSource[] = [
  {
    id: "bacteriurie",
    title: "Bacteriurie",
    description: "Diagnose en behandeling",
    metadata: {
      landingDescription: "Diagnose & behandeling",
      landingOrder: 100,
      landingSection: "secondary",
    },
  },
  {
    id: "leukocyturie",
    title: "Leukocyturie",
    description: "Geisoleerde leukocyturie",
    metadata: {
      landingDescription: "Geisoleerde leukocyturie",
      landingOrder: 110,
      landingSection: "secondary",
    },
  },
  {
    id: "hematurie",
    title: "Hematurie",
    description: "Beoordeling hematurie",
    metadata: {
      landingDescription: "Beoordeling hematurie",
      landingOrder: 120,
      landingSection: "secondary",
    },
  },
];

const iconKeys = ["healthy", "strip", "dipslide", "sediment", "culture"];

const IconMock: Component = {
  props: ["hover", "touch"],
  setup(props) {
    return () =>
      h(
        "svg",
        {
          viewBox: "0 0 120 120",
          role: "presentation",
          "aria-hidden": "true",
          style: {
            opacity: props.hover || props.touch ? 1 : 0.72,
            transition: "opacity var(--motion-duration-short) var(--motion-easing-standard)",
          },
        },
        [
          h("circle", {
            cx: "60",
            cy: "60",
            r: "42",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "8",
          }),
          h("path", {
            d: "M32 68h56M60 32v56",
            stroke: "currentColor",
            "stroke-width": "8",
            "stroke-linecap": "round",
          }),
        ],
      );
  },
};

const meta = {
  title: "Templates/LandingTemplate",
  component: LandingTemplate,
  tags: ["autodocs"],
  args: {
    items: [...primaryItems, ...secondaryItems],
    iconKeys,
    title: "Beslishulp urineonderzoek - kies een test",
    label: "Beslishulp urineonderzoek",
    secondaryHeading: "Urineweginfecties",
    questionnairePath: (id: string) => `/questionnaire/${id}`,
    iconComponent: (icon: string | undefined) =>
      icon && iconKeys.includes(icon) ? IconMock : null,
  },
  render: (args) => ({
    components: { LandingTemplate },
    setup: () => ({ args }),
    template: `<LandingTemplate v-bind="args" />`,
  }),
} satisfies Meta<typeof LandingTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FivePrimaryFlows: Story = {};

export const SecondaryGuidelines: Story = {
  args: {
    items: secondaryItems,
    iconKeys: [],
  },
};
