import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import QuestionnaireTemplate from "./QuestionnaireTemplate.vue";
import type { Answer, Question, QuestionOption } from "../../types";

const options: QuestionOption[] = [
  {
    id: "o-ja",
    value: "ja",
    text: "Ja",
    description: "Toelichting",
  },
  {
    id: "o-nee",
    value: "nee",
    text: "Nee",
  },
];

const question: Question = {
  id: "q-klachten",
  text: "Zijn er klachten?",
  type: "select",
  description: "Vraaguitleg",
  options,
};

const skeletonStub = {
  props: ["variant"],
  template: `<span class="skeleton-stub" :data-variant="variant" />`,
};

const questionPanelStub = {
  props: [
    "question",
    "stepDescription",
    "descriptionHtml",
    "hasHistory",
    "progressValue",
    "progressMax",
    "progressLabel",
    "progressText",
    "selectedOptionIds",
    "selectedCount",
    "hasSelectedOptions",
    "multiSelect",
    "nonTouch",
    "activePopoverOptionId",
  ],
  emits: [
    "restart",
    "choose",
    "showPopover",
    "togglePopover",
    "schedulePopoverClose",
    "closePopover",
    "confirm",
  ],
  template: `
    <article
      class="question-panel-stub"
      :data-question-id="question.id"
      :data-step-description="stepDescription"
      :data-description-html="descriptionHtml"
      :data-has-history="String(hasHistory)"
      :data-progress-value="progressValue"
      :data-progress-max="progressMax"
      :data-progress-label="progressLabel"
      :data-progress-text="progressText"
      :data-selected-option-ids="selectedOptionIds.join(',')"
      :data-selected-count="selectedCount"
      :data-has-selected-options="String(hasSelectedOptions)"
      :data-multi-select="String(multiSelect)"
      :data-non-touch="String(nonTouch)"
      :data-active-popover-option-id="activePopoverOptionId"
    >
      <button class="restart" type="button" @click="$emit('restart')">Opnieuw</button>
      <button class="choose" type="button" @click="$emit('choose', question.options[0])">
        Kies
      </button>
      <button class="show" type="button" @mouseenter="$emit('showPopover', question.options[0], $event)">
        Toon
      </button>
      <button class="toggle" type="button" @click="$emit('togglePopover', question.options[0], $event)">
        Toggle
      </button>
      <button class="schedule" type="button" @click="$emit('schedulePopoverClose')">
        Sluit later
      </button>
      <button class="close" type="button" @click="$emit('closePopover')">Sluit</button>
      <button class="confirm" type="button" @click="$emit('confirm')">Bevestig</button>
    </article>
  `,
};

const multiInputPanelStub = {
  props: [
    "title",
    "questions",
    "answers",
    "stepDescription",
    "hasHistory",
    "progressValue",
    "progressMax",
  ],
  emits: ["restart", "update-answer", "submit"],
  template: `
    <article
      class="multi-input-panel-stub"
      :data-title="title"
      :data-question-ids="questions.map((question) => question.id).join(',')"
      :data-answer-count="Object.keys(answers).length"
      :data-step-description="stepDescription"
      :data-has-history="String(hasHistory)"
      :data-progress-value="progressValue"
      :data-progress-max="progressMax"
    >
      <button class="group-restart" type="button" @click="$emit('restart')">Opnieuw</button>
      <button
        class="group-update"
        type="button"
        @click="$emit('update-answer', questions[0].id, { value: '70', text: '70' })"
      >
        Update
      </button>
      <button class="group-submit" type="button" @click="$emit('submit')">Verder</button>
    </article>
  `,
};

const groupQuestions: Question[] = [
  {
    id: "q-leeftijd",
    text: "Leeftijd",
    type: "number",
    options: [],
  },
  {
    id: "q-roken",
    text: "Rookt de patiënt?",
    type: "boolean",
    options: [],
  },
];

const groupAnswers: Record<string, Answer> = {
  "q-leeftijd": { value: "70", text: "70" },
};

const infoPopoverStub = {
  props: ["activeOptionId", "html", "popoverStyle"],
  emits: ["cancelClose", "scheduleClose", "close"],
  template: `
    <aside
      class="info-popover-stub"
      :data-active-option-id="activeOptionId"
      :data-html="html"
      :style="popoverStyle"
    >
      <button class="cancel-popover" type="button" @click="$emit('cancelClose')">Cancel</button>
      <button class="schedule-popover" type="button" @click="$emit('scheduleClose')">Schedule</button>
      <button class="close-popover" type="button" @click="$emit('close')">Close</button>
    </aside>
  `,
};

function mountTemplate(
  overrides: Partial<InstanceType<typeof QuestionnaireTemplate>["$props"]> = {},
) {
  return mount(QuestionnaireTemplate, {
    props: {
      isLoading: false,
      question,
      stepDescription: "Stap 1",
      descriptionHtml: "<p>Beschrijving</p>",
      hasHistory: true,
      progressValue: 1,
      progressMax: 4,
      progressLabel: "Vraag 1 van 4",
      progressText: "25%",
      selectedOptionIds: ["o-ja"],
      selectedCount: 1,
      hasSelectedOptions: true,
      multiSelect: false,
      nonTouch: true,
      activePopoverOptionId: "o-ja",
      popoverHtml: "<p>Optie-uitleg</p>",
      popoverStyle: { left: "10px", top: "20px" },
      ...overrides,
    },
    global: {
      stubs: {
        InfoPopover: infoPopoverStub,
        MultiInputPanel: multiInputPanelStub,
        QuestionPanel: questionPanelStub,
        Skeleton: skeletonStub,
        Transition: false,
      },
    },
  });
}

describe("QuestionnaireTemplate", () => {
  it("renders loading skeleton with accessible busy state", () => {
    const wrapper = mountTemplate({ isLoading: true, question: null });

    const loading = wrapper.get(".questionnaire-template__loading");
    expect(loading.attributes("aria-busy")).toBe("true");
    expect(loading.attributes("aria-label")).toBe("Vragenlijst laden");
    expect(loading.classes()).toContain("card--elevated");
    expect(
      wrapper.findAll(".skeleton-stub").map((item) => item.attributes("data-variant")),
    ).toEqual(["title", "short", "option", "option", "option"]);
    expect(wrapper.find(".question-panel-stub").exists()).toBe(false);
  });

  it("delegates loading shell styling to Card", () => {
    const source = readFileSync("src/components/templates/QuestionnaireTemplate.vue", "utf8");
    const loadingCss = source.match(/\.questionnaire-template__loading\s*\{(?<body>[\s\S]*?)\n\}/)
      ?.groups?.body;

    expect(source).toContain("<Card");
    expect(source).toContain('variant="elevated"');
    expect(loadingCss).not.toContain("border-radius:");
    expect(loadingCss).not.toContain("background:");
    expect(loadingCss).not.toContain("box-shadow:");
  });

  it("passes question state to panel and popover", () => {
    const wrapper = mountTemplate();
    const panel = wrapper.get(".question-panel-stub");
    const popover = wrapper.get(".info-popover-stub");

    expect(wrapper.get("section").attributes("aria-label")).toBe("Vragenlijst");
    expect(panel.attributes("data-question-id")).toBe("q-klachten");
    expect(panel.attributes("data-step-description")).toBe("Stap 1");
    expect(panel.attributes("data-description-html")).toBe("<p>Beschrijving</p>");
    expect(panel.attributes("data-progress-label")).toBe("Vraag 1 van 4");
    expect(panel.attributes("data-selected-option-ids")).toBe("o-ja");
    expect(panel.attributes("data-active-popover-option-id")).toBe("o-ja");
    expect(popover.attributes("data-active-option-id")).toBe("o-ja");
    expect(popover.attributes("data-html")).toBe("<p>Optie-uitleg</p>");
    expect(popover.attributes("style")).toContain("left: 10px");
  });

  it("renders grouped multi-input steps and relays group events", async () => {
    const wrapper = mountTemplate({
      groupAnswers,
      groupQuestions,
      groupTitle: "CVRM risicogegevens",
      isGroupedStep: true,
    });
    const panel = wrapper.get(".multi-input-panel-stub");

    expect(panel.attributes("data-title")).toBe("CVRM risicogegevens");
    expect(panel.attributes("data-question-ids")).toBe("q-leeftijd,q-roken");
    expect(panel.attributes("data-answer-count")).toBe("1");
    expect(wrapper.find(".question-panel-stub").exists()).toBe(false);

    await wrapper.get(".group-restart").trigger("click");
    await wrapper.get(".group-update").trigger("click");
    await wrapper.get(".group-submit").trigger("click");

    expect(wrapper.emitted("restart")).toHaveLength(1);
    expect(wrapper.emitted("updateGroupAnswer")?.[0]).toEqual([
      "q-leeftijd",
      { value: "70", text: "70" },
    ]);
    expect(wrapper.emitted("submitGroup")).toHaveLength(1);
  });

  it("renders result-pending state when loaded without current question", () => {
    const wrapper = mountTemplate({ question: null });

    expect(wrapper.get(".questionnaire-template__pending").text()).toContain(
      "Resultaat bepalen...",
    );
    expect(wrapper.find(".question-panel-stub").exists()).toBe(false);
  });

  it("relays panel and popover events", async () => {
    const wrapper = mountTemplate();

    await wrapper.get(".restart").trigger("click");
    await wrapper.get(".choose").trigger("click");
    await wrapper.get(".show").trigger("mouseenter");
    await wrapper.get(".toggle").trigger("click");
    await wrapper.get(".schedule").trigger("click");
    await wrapper.get(".cancel-popover").trigger("click");
    await wrapper.get(".schedule-popover").trigger("click");
    await wrapper.get(".close").trigger("click");
    await wrapper.get(".close-popover").trigger("click");
    await wrapper.get(".confirm").trigger("click");

    expect(wrapper.emitted("restart")).toHaveLength(1);
    expect(wrapper.emitted("choose")?.[0]).toEqual([options[0]]);
    expect(wrapper.emitted("showPopover")?.[0]?.[0]).toEqual(options[0]);
    expect(wrapper.emitted("togglePopover")?.[0]?.[0]).toEqual(options[0]);
    expect(wrapper.emitted("schedulePopoverClose")).toHaveLength(2);
    expect(wrapper.emitted("cancelPopoverClose")).toHaveLength(1);
    expect(wrapper.emitted("closePopover")).toHaveLength(2);
    expect(wrapper.emitted("confirm")).toHaveLength(1);
  });
});
