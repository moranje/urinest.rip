import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Notice from "./Notice.vue";

describe("Notice", () => {
  it("renders warning notices as assertive alerts when requested", () => {
    const wrapper = mount(Notice, {
      props: {
        variant: "warning",
        title: "Waarschuwing",
        role: "alert",
      },
      slots: {
        default: "<p>Controleer alarmsymptomen.</p>",
      },
    });

    expect(wrapper.attributes("role")).toBe("alert");
    expect(wrapper.attributes("aria-live")).toBe("assertive");
    expect(wrapper.classes()).toContain("notice--warning");
    expect(wrapper.get(".notice__title").text()).toBe("Waarschuwing");
    expect(wrapper.text()).toContain("Controleer alarmsymptomen.");
  });

  it("renders status notices politely by default", () => {
    const wrapper = mount(Notice, {
      slots: {
        default: "Behandeling verborgen tot controle is afgerond.",
      },
    });

    expect(wrapper.attributes("role")).toBe("status");
    expect(wrapper.attributes("aria-live")).toBe("polite");
    expect(wrapper.classes()).toContain("notice--info");
  });

  it("supports an action slot", () => {
    const wrapper = mount(Notice, {
      slots: {
        default: "Nieuwe versie beschikbaar.",
        action: '<button type="button">Vernieuw</button>',
      },
    });

    expect(wrapper.get(".notice__action button").text()).toBe("Vernieuw");
  });

  it("keeps warning styling low-emphasis and tokenized", () => {
    const source = readFileSync("src/components/molecules/Notice.vue", "utf8");
    const warningCss = source.match(/\.notice--warning\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body;

    expect(warningCss).toBeDefined();
    expect(warningCss).toContain("--notice-bg");
    expect(warningCss).toContain("color-mix");
    expect(warningCss).not.toContain("background: var(--md-sys-color-warning-container)");
  });
});
