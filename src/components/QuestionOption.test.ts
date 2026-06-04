import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import QuestionOption from "./QuestionOption.vue";
import type { QuestionOption as QuestionOptionData } from "../types";

const option: QuestionOptionData = {
  id: "q1-o1",
  value: "yes",
  text: "Ja",
  description: "Extra uitleg",
};

const baseProps = {
  option,
  index: 0,
  selected: false,
  multiSelect: false,
  nonTouch: true,
  tabIndex: 0,
  popoverOpen: false,
};

describe("QuestionOption", () => {
  it("renders as a radio option with stable keyboard affordance", async () => {
    const wrapper = mount(QuestionOption, { props: baseProps });
    const item = wrapper.get(".option-item");

    expect(item.element.tagName).toBe("BUTTON");
    expect(item.attributes("type")).toBe("button");
    expect(item.attributes("role")).toBe("radio");
    expect(item.attributes("aria-checked")).toBe("false");
    expect(wrapper.text()).toContain("A.");
    expect(wrapper.text()).toContain("Ja");

    await item.trigger("keydown.enter");
    await item.trigger("keydown.space");

    expect(wrapper.emitted("choose")).toHaveLength(2);
    expect(wrapper.emitted("choose")?.[0]).toEqual([option]);
  });

  it("renders selected multi-select options as checkboxes", () => {
    const wrapper = mount(QuestionOption, {
      props: { ...baseProps, selected: true, multiSelect: true, nonTouch: false },
    });
    const item = wrapper.get(".option-item");

    expect(item.attributes("role")).toBe("checkbox");
    expect(item.attributes("aria-checked")).toBe("true");
    expect(wrapper.get(".choice-option").classes()).toContain("option-selected");
    expect(wrapper.text()).not.toContain("A.");
  });

  it("emits sibling focus only for single-select radiogroups", async () => {
    const wrapper = mount(QuestionOption, { props: baseProps });

    await wrapper.get(".option-item").trigger("keydown.down");
    expect(wrapper.emitted("focusSibling")?.[0]).toEqual([0, 1]);

    const multi = mount(QuestionOption, { props: { ...baseProps, multiSelect: true } });
    await multi.get(".option-item").trigger("keydown.down");
    expect(multi.emitted("focusSibling")).toBeUndefined();
  });

  it("keeps info-button interaction separate from choosing the option", async () => {
    const wrapper = mount(QuestionOption, { props: baseProps });
    const info = wrapper.get("button.info-icon");

    await info.trigger("click");
    await info.trigger("focus");
    await info.trigger("mouseenter");
    await info.trigger("mouseleave");
    await info.trigger("blur");

    expect(wrapper.emitted("showPopover")?.[0]).toEqual([option, expect.any(MouseEvent)]);
    expect(wrapper.emitted("showPopover")).toHaveLength(3);
    expect(wrapper.emitted("schedulePopoverClose")).toHaveLength(2);
    expect(wrapper.emitted("togglePopover")).toBeUndefined();
    expect(wrapper.emitted("choose")).toBeUndefined();
  });
});
