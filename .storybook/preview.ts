import type { Preview } from "@storybook/vue3-vite";

// Global styles — imports tokens, component layer and base styles.
import "../src/styles/main.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "surface",
      values: [
        { name: "surface", value: "var(--md-sys-color-background)" },
        { name: "surface-container", value: "var(--md-sys-color-surface-container)" },
      ],
    },
    options: {
      storySort: {
        order: [
          "Tokens",
          "Primitives",
          ["Button", "Card", "Badge", "Skeleton", "BackButton", "ProgressBar", "FormControls"],
          "Molecules",
          ["SegmentedControl", "ChoiceOption", "Notice"],
          "Organisms",
          ["QuestionPanel"],
          "Templates",
          ["ResultTemplate"],
        ],
      },
    },
    a11y: {
      test: "error",
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Light/dark theme toggle",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      const theme = context.globals.theme === "dark" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme);
      }
      return { components: { story }, template: "<story />" };
    },
  ],
};

export default preview;
