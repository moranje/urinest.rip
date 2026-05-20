import type { Preview } from "@storybook/vue3-vite";

// Global styles — design tokens + base styles for accurate primitive rendering
import "../src/styles/tokens.css";
import "../src/styles/themes.css";
import "../src/styles/main.css";
import "../src/styles/components.css";

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
        { name: "surface", value: "#fcfcff" },
        { name: "surface-dark", value: "#1a1c1e" },
      ],
    },
    options: {
      storySort: {
        order: [
          "Tokens",
          "Primitives",
          ["Button", "Card", "Badge", "Skeleton", "BackButton", "ProgressBar"],
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
