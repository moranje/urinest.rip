import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ChoiceGroup from "./ChoiceGroup.vue";
import type { QuestionOption } from "../../types";

const options: QuestionOption[] = [
  { id: "a", value: "a", text: "Optie A", description: "Uitleg A" },
  { id: "b", value: "b", text: "Optie B" },
  { id: "c", value: "c", text: "Optie C" },
];

const baseProps = {
  options,
  multiSelect: false,
  nonTouch: true,
  labelledBy: "question-title",
};

describe("ChoiceGroup", () => {
  it("renders a radiogroup with one tabbable option", async () => {
    const wrapper = mount(ChoiceGroup, {
      props: {
        ...baseProps,
        selectedOptionIds: ["b"],
      },
    });

    expect(wrapper.attributes("role")).toBe("radiogroup");
    expect(wrapper.attributes("aria-labelledby")).toBe("question-title");
    expect(
      wrapper.findAll(".choice-option__button").map((button) => button.attributes("tabindex")),
    ).toEqual(["-1", "0", "-1"]);

    await wrapper.findAll(".choice-option__button")[1]?.trigger("click");
    expect(wrapper.emitted("choose")?.[0]).toEqual([options[1]]);
  });

  it("wraps keyboard focus between sibling radio options", async () => {
    const wrapper = mount(ChoiceGroup, {
      attachTo: document.body,
      props: {
        ...baseProps,
        selectedOptionIds: ["c"],
      },
    });

    const buttons = wrapper.findAll<HTMLButtonElement>(".choice-option__button");
    buttons[2]?.element.focus();
    await buttons[2]?.trigger("keydown.right");

    expect(document.activeElement).toBe(buttons[0]?.element);
    wrapper.unmount();
  });

  it("renders multi-select choices with counter and confirm state", async () => {
    const wrapper = mount(ChoiceGroup, {
      props: {
        ...baseProps,
        multiSelect: true,
        selectedOptionIds: ["a", "c"],
        selectedCount: 2,
        hasSelectedOptions: true,
      },
    });

    expect(wrapper.attributes("role")).toBe("group");
    expect(
      wrapper.findAll(".choice-option__button").map((button) => button.attributes("role")),
    ).toEqual(["checkbox", "checkbox", "checkbox"]);
    expect(wrapper.get(".choice-group__counter").text()).toBe("2 geselecteerd");

    await wrapper.get(".choice-group__confirm").trigger("click");
    expect(wrapper.emitted("confirm")).toHaveLength(1);
  });
});
