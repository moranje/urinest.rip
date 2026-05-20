import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Badge from "./Badge.vue";

describe("Badge primitive", () => {
  it("renders slot content", () => {
    const wrapper = mount(Badge, { slots: { default: "U2" } });
    expect(wrapper.text()).toContain("U2");
  });

  it("defaults to info variant", () => {
    const wrapper = mount(Badge, { slots: { default: "X" } });
    expect(wrapper.classes()).toContain("badge--info");
  });

  it("applies u1 variant (spoed)", () => {
    const wrapper = mount(Badge, { props: { variant: "u1" }, slots: { default: "U1" } });
    expect(wrapper.classes()).toContain("badge--u1");
  });

  it("applies u3 variant (warning)", () => {
    const wrapper = mount(Badge, { props: { variant: "u3" }, slots: { default: "U3" } });
    expect(wrapper.classes()).toContain("badge--u3");
  });

  it("forwards aria-label and role", () => {
    const wrapper = mount(Badge, {
      props: { variant: "u1", role: "status", ariaLabel: "Spoed" },
      slots: { default: "U1" },
    });
    expect(wrapper.attributes("aria-label")).toBe("Spoed");
    expect(wrapper.attributes("role")).toBe("status");
  });

  it("applies pulse class when enabled", () => {
    const wrapper = mount(Badge, {
      props: { variant: "u1", pulse: true },
      slots: { default: "U1" },
    });
    expect(wrapper.classes()).toContain("badge--pulse");
  });
});
