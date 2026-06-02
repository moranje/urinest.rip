import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import QuestionToolbar from "./QuestionToolbar.vue";

describe("QuestionToolbar", () => {
  it("renders navigation actions when history is available", async () => {
    const wrapper = mount(QuestionToolbar, {
      props: { hasHistory: true },
    });

    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.attributes("aria-label")).toBe("Vorige vraag (Esc of Backspace)");
    expect(buttons[1]?.attributes("aria-label")).toBe("Opnieuw beginnen");

    await buttons[0]?.trigger("click");
    await buttons[1]?.trigger("click");

    expect(wrapper.emitted("back")).toHaveLength(1);
    expect(wrapper.emitted("restart")).toHaveLength(1);
  });

  it("keeps layout stable without action buttons", () => {
    const wrapper = mount(QuestionToolbar, {
      props: { hasHistory: false },
    });

    expect(wrapper.findAll("button")).toHaveLength(0);
    expect(wrapper.find(".question-toolbar__spacer").exists()).toBe(true);
  });
});
