import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import BackButton from "./BackButton.vue";

describe("BackButton primitive", () => {
  it("renders default label", () => {
    const wrapper = mount(BackButton);
    expect(wrapper.text()).toContain("Terug");
  });

  it("renders custom slot content", () => {
    const wrapper = mount(BackButton, { slots: { default: "Vorige stap" } });
    expect(wrapper.text()).toContain("Vorige stap");
  });

  it("emits click", async () => {
    const wrapper = mount(BackButton);
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toBeTruthy();
  });

  it("exposes aria-label", () => {
    const wrapper = mount(BackButton, { props: { ariaLabel: "Vorige vraag" } });
    expect(wrapper.attributes("aria-label")).toBe("Vorige vraag");
  });
});
