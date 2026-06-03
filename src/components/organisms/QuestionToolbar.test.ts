import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import QuestionToolbar from "./QuestionToolbar.vue";

describe("QuestionToolbar", () => {
  it("renders restart without a synthetic back button when the flow can restart", async () => {
    const wrapper = mount(QuestionToolbar, {
      props: { canRestart: true },
    });

    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.attributes("aria-label")).toBe("Opnieuw beginnen");
    expect(buttons[0]?.classes()).toContain("icon-button");
    expect(wrapper.find(".question-toolbar__back").exists()).toBe(false);

    await buttons[0]?.trigger("click");

    expect(wrapper.emitted("restart")).toHaveLength(1);
  });

  it("keeps layout stable without action buttons", () => {
    const wrapper = mount(QuestionToolbar, {
      props: { canRestart: false },
    });

    expect(wrapper.findAll("button")).toHaveLength(0);
    expect(wrapper.find(".question-toolbar__spacer").exists()).toBe(true);
  });

  it("delegates control styling to primitives", () => {
    const source = readFileSync("src/components/organisms/QuestionToolbar.vue", "utf8");

    expect(source).toContain("IconButton");
    expect(source).not.toContain("BackButton");
    expect(source).not.toContain(".question-toolbar__back {");
    expect(source).not.toContain(".question-toolbar__restart {");
  });
});
