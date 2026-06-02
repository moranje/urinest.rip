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
