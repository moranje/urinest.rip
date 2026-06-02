import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import InfoPopover from "./InfoPopover.vue";

describe("InfoPopover", () => {
  it("renders a dialog with sanitized html and stable option id", () => {
    const wrapper = mount(InfoPopover, {
      props: {
        activeOptionId: "opt-1",
        html: "<p>Toelichting</p>",
        popoverStyle: { position: "fixed", top: "12px", left: "20px", visibility: "visible" },
      },
      global: {
        stubs: { teleport: true },
      },
    });

    const popover = wrapper.get(".info-popover");
    expect(popover.attributes("id")).toBe("option-info-opt-1");
    expect(popover.attributes("role")).toBe("dialog");
    expect(popover.attributes("aria-label")).toBe("Meer informatie");
    expect(popover.html()).toContain("<p>Toelichting</p>");
    expect(popover.attributes("style")).toContain("top: 12px");
  });

  it("emits close lifecycle events without owning the timer", async () => {
    const wrapper = mount(InfoPopover, {
      props: {
        activeOptionId: "opt-1",
        html: "Toelichting",
        popoverStyle: {},
      },
      global: {
        stubs: { teleport: true },
      },
    });

    await wrapper.get(".info-popover").trigger("mouseenter");
    await wrapper.get(".info-popover").trigger("mouseleave");
    await wrapper.get(".info-popover").trigger("focusin");
    await wrapper.get(".info-popover").trigger("focusout");
    await wrapper.get(".info-popover__close").trigger("click");

    expect(wrapper.emitted("cancelClose")).toHaveLength(2);
    expect(wrapper.emitted("scheduleClose")).toHaveLength(2);
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("renders nothing when inactive", () => {
    const wrapper = mount(InfoPopover, {
      props: {
        activeOptionId: null,
        html: "Verborgen",
        popoverStyle: {},
      },
      global: {
        stubs: { teleport: true },
      },
    });

    expect(wrapper.find(".info-popover").exists()).toBe(false);
  });
});
