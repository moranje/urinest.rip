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

  it("supports page-level notice headings when needed", () => {
    const wrapper = mount(Notice, {
      props: {
        title: "Resultaat niet gevonden",
        titleTag: "h1",
        role: "alert",
      },
      slots: {
        default: "<p>Resultaat niet beschikbaar.</p>",
      },
    });

    expect(wrapper.get("h1.notice__title").text()).toBe("Resultaat niet gevonden");
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
    const baseCss = source.match(/\.notice\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body;
    const warningCss = source.match(/\.notice--warning\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body;

    expect(baseCss).toBeDefined();
    expect(baseCss).toContain("gap: var(--spacing-md)");
    expect(baseCss).toContain("--notice-accent-width: 4px");
    expect(baseCss).toContain("--notice-padding-block: clamp(24px, 4vw, 36px)");
    expect(baseCss).toContain("--notice-padding-inline: clamp(32px, 5vw, 48px)");
    expect(baseCss).toContain("padding-block: var(--notice-padding-block)");
    expect(baseCss).toContain("padding-inline: var(--notice-padding-inline)");
    expect(baseCss).toContain("border: 0");
    expect(baseCss).toContain(
      "box-shadow: inset var(--notice-accent-width) 0 0 var(--notice-accent)",
    );
    expect(baseCss).toContain("overflow: hidden");
    expect(warningCss).toBeDefined();
    expect(warningCss).toContain("--notice-bg");
    expect(warningCss).toContain("color-mix");
    expect(warningCss).not.toContain("background: var(--md-sys-color-warning-container)");
  });
});
