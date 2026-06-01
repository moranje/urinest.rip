import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ProgressBar from "./ProgressBar.vue";

describe("ProgressBar primitive", () => {
  it("exposes role=progressbar with aria values", () => {
    const wrapper = mount(ProgressBar, { props: { value: 2, max: 5 } });
    expect(wrapper.attributes("role")).toBe("progressbar");
    expect(wrapper.attributes("aria-valuemin")).toBe("0");
    expect(wrapper.attributes("aria-valuemax")).toBe("5");
    expect(wrapper.attributes("aria-valuenow")).toBe("2");
  });

  it("computes width as percentage", () => {
    const wrapper = mount(ProgressBar, { props: { value: 2, max: 8 } });
    const fill = wrapper.find(".progress-bar-fill").element as HTMLElement;
    expect(fill.style.width).toBe("25%");
  });

  it("clamps to 0% when value is below min", () => {
    const wrapper = mount(ProgressBar, { props: { value: -3, max: 10 } });
    const fill = wrapper.find(".progress-bar-fill").element as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });

  it("clamps to 100% when value exceeds max", () => {
    const wrapper = mount(ProgressBar, { props: { value: 99, max: 10 } });
    const fill = wrapper.find(".progress-bar-fill").element as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });

  it("treats max <= 0 as 0%", () => {
    const wrapper = mount(ProgressBar, { props: { value: 1, max: 0 } });
    const fill = wrapper.find(".progress-bar-fill").element as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });

  it("renders an accessible label", () => {
    const wrapper = mount(ProgressBar, { props: { value: 1, max: 3, label: "Stap 1 van 3" } });
    expect(wrapper.attributes("aria-label")).toBe("Stap 1 van 3");
  });

  it("shows text when showText is set", () => {
    const wrapper = mount(ProgressBar, { props: { value: 2, max: 5, showText: true } });
    expect(wrapper.text()).toContain("2 / 5");
  });

  it("shows custom text when provided", () => {
    const wrapper = mount(ProgressBar, {
      props: {
        value: 2,
        max: 5,
        label: "Vraag 2 van ongeveer 5",
        text: "Vraag 2 van ongeveer 5",
        showText: true,
      },
    });
    expect(wrapper.text()).toContain("Vraag 2 van ongeveer 5");
  });
});
