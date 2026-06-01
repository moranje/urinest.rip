import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, h } from "vue";

/**
 * DesignTokens showcase — toont de semantische MD3-token-set die in
 * `src/styles/tokens.css` is gedefinieerd.
 * Bron-of-truth blijft de CSS; deze stories renderen swatches/voorbeelden
 * die live de `--md-sys-*` variabelen consumeren.
 */

const COLOR_TOKENS: Array<{ name: string; onName?: string; description?: string }> = [
  {
    name: "--md-sys-color-primary",
    onName: "--md-sys-color-on-primary",
    description: "Brand-actie, primary CTA",
  },
  {
    name: "--md-sys-color-primary-container",
    onName: "--md-sys-color-on-primary-container",
    description: "Subtiele primary-tint, success-context",
  },
  { name: "--md-sys-color-secondary", onName: "--md-sys-color-on-secondary" },
  { name: "--md-sys-color-secondary-container", onName: "--md-sys-color-on-secondary-container" },
  { name: "--md-sys-color-tertiary", onName: "--md-sys-color-on-tertiary" },
  {
    name: "--md-sys-color-error",
    onName: "--md-sys-color-on-error",
    description: "U1/U2-spoed, fouten",
  },
  {
    name: "--md-sys-color-warning",
    onName: "--md-sys-color-on-warning",
    description: "U3-routine, waarschuwing",
  },
  { name: "--md-sys-color-surface", onName: "--md-sys-color-on-surface" },
  { name: "--md-sys-color-surface-container-low" },
  { name: "--md-sys-color-surface-container" },
  { name: "--md-sys-color-surface-container-high" },
  { name: "--md-sys-color-outline" },
  { name: "--md-sys-color-outline-variant" },
  {
    name: "--md-sys-color-indicator-positive",
    description: "Strip positief (a855f7 → token, dark-mode-safe)",
  },
];

const TYPESCALE_TOKENS: Array<{ name: string; sample: string }> = [
  { name: "--md-sys-typescale-display-large", sample: "Display large" },
  { name: "--md-sys-typescale-display-medium", sample: "Display medium" },
  { name: "--md-sys-typescale-headline-large", sample: "Headline large" },
  { name: "--md-sys-typescale-headline-medium", sample: "Headline medium" },
  { name: "--md-sys-typescale-title-large", sample: "Title large" },
  { name: "--md-sys-typescale-title-medium", sample: "Title medium" },
  {
    name: "--md-sys-typescale-body-large",
    sample: "Body large — leesbaar voor lange klinische teksten.",
  },
  { name: "--md-sys-typescale-body-medium", sample: "Body medium — standaard tekstvariant." },
  { name: "--md-sys-typescale-label-large", sample: "Label large — knoplabels" },
  { name: "--md-sys-typescale-label-medium", sample: "Label medium" },
];

const SHAPE_TOKENS: Array<{ name: string }> = [
  { name: "--md-sys-shape-corner-extra-small" },
  { name: "--md-sys-shape-corner-small" },
  { name: "--md-sys-shape-corner-medium" },
  { name: "--md-sys-shape-corner-large" },
  { name: "--md-sys-shape-corner-extra-large" },
  { name: "--md-sys-shape-corner-full" },
];

const SPACING_TOKENS: Array<{ name: string }> = [
  { name: "--spacing-xs" },
  { name: "--spacing-sm" },
  { name: "--spacing-md" },
  { name: "--spacing-lg" },
  { name: "--spacing-xl" },
  { name: "--spacing-xxl" },
];

const ColorSwatches = defineComponent({
  setup() {
    return () =>
      h(
        "div",
        {
          style:
            "display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:12px;",
        },
        COLOR_TOKENS.map((token) =>
          h(
            "div",
            {
              style: `
                background: var(${token.name});
                color: ${token.onName ? `var(${token.onName})` : "var(--md-sys-color-on-surface)"};
                border: 1px solid var(--md-sys-color-outline-variant);
                border-radius: var(--md-sys-shape-corner-small);
                padding: 12px;
                min-height: 96px;
                display: flex;
                flex-direction: column;
                gap: 4px;
              `,
            },
            [
              h("strong", { style: "font-size:13px" }, token.name.replace("--md-sys-color-", "")),
              h(
                "code",
                { style: "font-size:11px; opacity:0.85; word-break:break-all;" },
                token.name,
              ),
              token.description
                ? h("span", { style: "font-size:11px; opacity:0.85;" }, token.description)
                : null,
            ],
          ),
        ),
      );
  },
});

const TypeScale = defineComponent({
  setup() {
    return () =>
      h(
        "div",
        { style: "display:flex; flex-direction:column; gap:16px;" },
        TYPESCALE_TOKENS.map((token) =>
          h(
            "div",
            {
              style:
                "border-bottom:1px solid var(--md-sys-color-outline-variant); padding-bottom:8px;",
            },
            [
              h("code", { style: "font-size:11px; opacity:0.7;" }, token.name),
              h(
                "div",
                {
                  style: `font: var(${token.name}); color: var(--md-sys-color-on-surface);`,
                },
                token.sample,
              ),
            ],
          ),
        ),
      );
  },
});

const ShapeScale = defineComponent({
  setup() {
    return () =>
      h(
        "div",
        { style: "display:flex; gap:16px; flex-wrap:wrap; align-items:flex-end;" },
        SHAPE_TOKENS.map((token) =>
          h("div", { style: "text-align:center;" }, [
            h("div", {
              style: `
                background: var(--md-sys-color-primary-container);
                width: 80px;
                height: 80px;
                border-radius: var(${token.name});
              `,
            }),
            h(
              "code",
              { style: "font-size:10px; display:block; margin-top:6px;" },
              token.name.replace("--md-sys-shape-corner-", ""),
            ),
          ]),
        ),
      );
  },
});

const SpacingScale = defineComponent({
  setup() {
    return () =>
      h(
        "div",
        { style: "display:flex; flex-direction:column; gap:8px;" },
        SPACING_TOKENS.map((token) =>
          h("div", { style: "display:flex; align-items:center; gap:12px;" }, [
            h("code", { style: "font-size:11px; min-width:140px;" }, token.name),
            h("div", {
              style: `background: var(--md-sys-color-primary); height: 16px; width: var(${token.name});`,
            }),
          ]),
        ),
      );
  },
});

const meta: Meta = {
  title: "Tokens/Design tokens",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Bron-of-truth: `src/styles/tokens.css`. Wissel het Theme-toolbar voor licht/donker.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Colors: Story = {
  render: () => ({
    components: { ColorSwatches },
    template: `<ColorSwatches />`,
  }),
};

export const Typography: Story = {
  render: () => ({
    components: { TypeScale },
    template: `<TypeScale />`,
  }),
};

export const Shape: Story = {
  render: () => ({
    components: { ShapeScale },
    template: `<ShapeScale />`,
  }),
};

export const Spacing: Story = {
  render: () => ({
    components: { SpacingScale },
    template: `<SpacingScale />`,
  }),
};
