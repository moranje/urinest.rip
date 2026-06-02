import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import QuestionPanel from "./QuestionPanel.vue";
import type { Question, QuestionOption } from "../../types";

const options: QuestionOption[] = [
  {
    id: "yes",
    value: "yes",
    text: "Ja",
    description: "Toelichting bij ja",
  },
  {
    id: "no",
    value: "no",
    text: "Nee",
  },
];

const question: Question = {
  id: "q-klachten",
  text: "Zijn er plasklachten?",
  type: "select",
  description: "Markdown toelichting",
  options,
};

const toolbarStub = {
  props: ["hasHistory"],
  emits: ["back", "restart"],
  template: `
    <nav class="question-toolbar-stub" :data-has-history="String(hasHistory)">
      <button type="button" class="back" @click="$emit('back')">Terug</button>
      <button type="button" class="restart" @click="$emit('restart')">Opnieuw</button>
    </nav>
  `,
};

const progressStub = {
  props: ["value", "max", "label", "text", "showText"],
  template: `
    <div
      class="progress-bar-stub"
      :data-value="value"
      :data-max="max"
      :data-label="label"
      :data-text="text"
      :data-show-text="showText === true ? 'true' : 'false'"
    />
  `,
};

const choiceGroupStub = {
  props: [
    "options",
    "selectedOptionIds",
    "selectedCount",
    "hasSelectedOptions",
    "multiSelect",
    "nonTouch",
    "labelledBy",
    "describedBy",
    "activePopoverOptionId",
  ],
  emits: [
    "choose",
    "showPopover",
    "togglePopover",
    "schedulePopoverClose",
    "closePopover",
    "confirm",
  ],
  template: `
    <div
      class="choice-group-stub"
      :role="multiSelect ? 'group' : 'radiogroup'"
      :aria-labelledby="labelledBy"
      :aria-describedby="describedBy"
      :data-selected="selectedOptionIds.join(',')"
      :data-selected-count="selectedCount"
      :data-has-selected-options="String(hasSelectedOptions)"
      :data-non-touch="String(nonTouch)"
      :data-active-popover="activePopoverOptionId"
    >
      <button type="button" class="choose" @click="$emit('choose', options[0])">Kies</button>
      <button type="button" class="show" @mouseenter="$emit('showPopover', options[0], $event)">
        Toon
      </button>
      <button type="button" class="toggle" @click="$emit('togglePopover', options[0], $event)">
        Toggle
      </button>
      <button type="button" class="schedule" @click="$emit('schedulePopoverClose')">
        Sluit later
      </button>
      <button type="button" class="close" @click="$emit('closePopover')">Sluit</button>
      <button type="button" class="confirm" @click="$emit('confirm')">Bevestig</button>
    </div>
  `,
};

const mountPanel = () =>
  mount(QuestionPanel, {
    props: {
      question,
      stepDescription: "Stapbeschrijving voor deze vraag",
      descriptionHtml: "<p><strong>Bron</strong>: richtlijntekst</p>",
      hasHistory: true,
      progressValue: 2,
      progressMax: 5,
      progressLabel: "Vraag 2 van 5",
      progressText: "40%",
      selectedOptionIds: ["yes"],
      selectedCount: 1,
      hasSelectedOptions: true,
      multiSelect: true,
      nonTouch: true,
      activePopoverOptionId: "yes",
    },
    global: {
      stubs: {
        ChoiceGroup: choiceGroupStub,
        ProgressBar: progressStub,
        QuestionToolbar: toolbarStub,
      },
    },
  });

describe("QuestionPanel", () => {
  it("renders question content, progress, and evidence description", () => {
    const wrapper = mountPanel();

    expect(wrapper.get("h1").attributes("id")).toBe("q-title-q-klachten");
    expect(wrapper.get("h1").attributes("tabindex")).toBe("-1");
    expect(wrapper.get("h1").text()).toBe("Zijn er plasklachten?");
    expect(wrapper.get(".sr-only").text()).toBe("Nieuwe vraag: Zijn er plasklachten?");
    expect(wrapper.get(".question-panel__step").attributes("id")).toBe("q-step-q-klachten");
    expect(wrapper.get(".question-panel__description").html()).toContain("<strong>Bron</strong>");
    expect(wrapper.get(".progress-bar-stub").attributes("data-label")).toBe(
      "Indicatieve voortgang door vragenlijst",
    );
    expect(wrapper.get(".progress-bar-stub").attributes("data-show-text")).toBe("false");
  });

  it("keeps programmatic title focus visually quiet", () => {
    const source = readFileSync("src/components/organisms/QuestionPanel.vue", "utf8");
    const titleFocusCss = source.match(/\.question-panel__title:focus\s*\{(?<body>[\s\S]*?)\n\}/)
      ?.groups?.body;

    expect(titleFocusCss).toBeDefined();
    expect(titleFocusCss).toContain("outline: none");
  });

  it("passes accessibility and selection state to the choice group", () => {
    const wrapper = mountPanel();
    const choiceGroup = wrapper.get(".choice-group-stub");

    expect(choiceGroup.attributes("aria-labelledby")).toBe("q-title-q-klachten");
    expect(choiceGroup.attributes("aria-describedby")).toBe("q-step-q-klachten");
    expect(choiceGroup.attributes("data-selected")).toBe("yes");
    expect(choiceGroup.attributes("data-selected-count")).toBe("1");
    expect(choiceGroup.attributes("data-has-selected-options")).toBe("true");
    expect(choiceGroup.attributes("data-non-touch")).toBe("true");
    expect(choiceGroup.attributes("data-active-popover")).toBe("yes");
  });

  it("relays toolbar and choice events without mutating payloads", async () => {
    const wrapper = mountPanel();

    await wrapper.get(".back").trigger("click");
    await wrapper.get(".restart").trigger("click");
    await wrapper.get(".choose").trigger("click");
    await wrapper.get(".show").trigger("mouseenter");
    await wrapper.get(".toggle").trigger("click");
    await wrapper.get(".schedule").trigger("click");
    await wrapper.get(".close").trigger("click");
    await wrapper.get(".confirm").trigger("click");

    expect(wrapper.emitted("back")).toHaveLength(1);
    expect(wrapper.emitted("restart")).toHaveLength(1);
    expect(wrapper.emitted("choose")?.[0]).toEqual([options[0]]);
    expect(wrapper.emitted("showPopover")?.[0]?.[0]).toEqual(options[0]);
    expect(wrapper.emitted("togglePopover")?.[0]?.[0]).toEqual(options[0]);
    expect(wrapper.emitted("schedulePopoverClose")).toHaveLength(1);
    expect(wrapper.emitted("closePopover")).toHaveLength(1);
    expect(wrapper.emitted("confirm")).toHaveLength(1);
  });
});
