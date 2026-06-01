import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import Icon from "./Icon.vue";

describe("Icon primitive", () => {
  it("renders decorative icons as hidden SVG", () => {
    const wrapper = mount(Icon, { props: { name: "copy", size: 16 } });
    expect(wrapper.attributes("aria-hidden")).toBe("true");
    expect((wrapper.element as SVGElement).style.width).toBe("16px");
  });

  it("renders titled icons as images", () => {
    const wrapper = mount(Icon, { props: { name: "warning", title: "Waarschuwing" } });
    expect(wrapper.attributes("role")).toBe("img");
    expect(wrapper.text()).toContain("Waarschuwing");
  });
});
