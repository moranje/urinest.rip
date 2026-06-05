import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ChoiceOption from "./ChoiceOption.vue";
import type { QuestionOption as QuestionOptionData } from "../../types";

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

describe("ChoiceOption", () => {
  it("renders as a keyboard-operable radio option", async () => {
    const wrapper = mount(ChoiceOption, { props: baseProps });
    const item = wrapper.get(".choice-option__button");

    expect(item.element.tagName).toBe("BUTTON");
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
    const wrapper = mount(ChoiceOption, {
      props: { ...baseProps, selected: true, multiSelect: true, nonTouch: false },
    });
    const item = wrapper.get(".choice-option__button");

    expect(item.attributes("role")).toBe("checkbox");
    expect(item.attributes("aria-checked")).toBe("true");
    expect(item.classes()).toContain("choice-option__button--selected");
    expect(wrapper.text()).not.toContain("A.");
  });

  it("keeps info-button interaction separate from choosing the option", async () => {
    const wrapper = mount(ChoiceOption, { props: baseProps });
    const info = wrapper.get('[data-testid="choice-option-info"]');

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

  it("links open answer info to option and info controls with ARIA", () => {
    const wrapper = mount(ChoiceOption, { props: { ...baseProps, popoverOpen: true } });
    const item = wrapper.get(".choice-option__button");
    const info = wrapper.get('[data-testid="choice-option-info"]');

    expect(item.attributes("aria-describedby")).toBe("option-info-q1-o1");
    expect(info.attributes("aria-expanded")).toBe("true");
    expect(info.attributes("aria-controls")).toBe("option-info-q1-o1");
    expect(info.attributes("aria-describedby")).toBe("option-info-q1-o1");
  });

  it("omits popover ARIA and info control when answer info is closed or absent", () => {
    const closed = mount(ChoiceOption, { props: baseProps });
    const withoutDescription = mount(ChoiceOption, {
      props: {
        ...baseProps,
        option: { ...option, description: undefined },
      },
    });

    expect(closed.get(".choice-option__button").attributes("aria-describedby")).toBeUndefined();
    expect(closed.get('[data-testid="choice-option-info"]').attributes("aria-expanded")).toBe(
      "false",
    );
    expect(
      closed.get('[data-testid="choice-option-info"]').attributes("aria-describedby"),
    ).toBeUndefined();
    expect(withoutDescription.find('[data-testid="choice-option-info"]').exists()).toBe(false);
  });

  it("keeps info controls integrated inside the option card", () => {
    const wrapper = mount(ChoiceOption, { props: baseProps });
    const source = readFileSync("src/components/molecules/ChoiceOption.vue", "utf8");
    const cardCss = source.match(/\.choice-option\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body;

    expect(wrapper.get(".choice-option__info").element.parentElement).toBe(
      wrapper.get(".choice-option").element,
    );
    expect(source).toContain("<IconButton");
    expect(source).not.toContain('class="choice-option__info-button');
    expect(source).not.toContain(".choice-option__info-button");
    expect(cardCss).toContain("display: grid");
    expect(cardCss).toContain("grid-template-columns: minmax(0, 1fr) auto");
  });

  it("keeps answer card states free of full-frame accent borders", () => {
    const source = readFileSync("src/components/molecules/ChoiceOption.vue", "utf8");
    const globalCss = readFileSync("src/styles/main.css", "utf8");
    const cardCss = source.match(/\.choice-option\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body;
    const focusCss = source.match(/\.choice-option:focus-within\s*\{(?<body>[\s\S]*?)\n\}/)?.groups
      ?.body;
    const selectedCss = source.match(/\.choice-option--selected\s*\{(?<body>[\s\S]*?)\n\}/)?.groups
      ?.body;

    expect(cardCss).toContain("border: 0");
    expect(focusCss).toContain("outline: none");
    expect(focusCss).toContain("box-shadow: inset 4px 0 0 var(--md-sys-color-primary)");
    expect(focusCss).not.toContain("outline: 2px solid");
    expect(selectedCss).not.toContain("border-color: var(--md-sys-color-primary)");
    expect(selectedCss).not.toContain("border:");
    expect(globalCss).not.toContain(".option-item,\n");
    expect(globalCss).not.toContain(".option-selected");
  });
});
