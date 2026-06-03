import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Card from "./Card.vue";

describe("Card primitive", () => {
  it("renders default slot", () => {
    const wrapper = mount(Card, { slots: { default: "Inhoud" } });
    expect(wrapper.text()).toContain("Inhoud");
  });

  it("applies plain variant by default", () => {
    const wrapper = mount(Card, { slots: { default: "x" } });
    expect(wrapper.classes()).toContain("card--plain");
  });

  it("applies accent variant", () => {
    const wrapper = mount(Card, { props: { variant: "accent" }, slots: { default: "x" } });
    expect(wrapper.classes()).toContain("card--accent");
  });

  it("keeps accent variant free of full outline borders", () => {
    const source = readFileSync("src/components/primitives/Card.vue", "utf8");
    const baseCss = source.match(/\.card\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? "";
    const accentCss = source.match(/\.card--accent\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? "";

    expect(baseCss).toContain("border: 0");
    expect(baseCss).toContain("overflow: hidden");
    expect(accentCss).toContain("padding-block: clamp(24px, 4vw, 36px)");
    expect(accentCss).toContain("padding-inline: clamp(32px, 5vw, 48px)");
    expect(accentCss).toContain("box-shadow: inset 4px 0 0 var(--md-sys-color-primary)");
    expect(accentCss).not.toContain("border:");
  });

  it("applies outlined variant", () => {
    const wrapper = mount(Card, { props: { variant: "outlined" }, slots: { default: "x" } });
    expect(wrapper.classes()).toContain("card--outlined");
  });

  it("supports semantic card tags", () => {
    const wrapper = mount(Card, {
      props: { tag: "section", variant: "outlined" },
      slots: { default: "Logdetail" },
    });

    expect(wrapper.element.tagName).toBe("SECTION");
    expect(wrapper.classes()).toContain("card--outlined");
  });
});
