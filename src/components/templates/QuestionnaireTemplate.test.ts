import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import QuestionnaireTemplate from "./QuestionnaireTemplate.vue";
import type { Question, QuestionOption } from "../../types";

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
    "back",
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
      <button class="back" type="button" @click="$emit('back')">Terug</button>
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
    expect(
      wrapper.findAll(".skeleton-stub").map((item) => item.attributes("data-variant")),
    ).toEqual(["title", "short", "option", "option", "option"]);
    expect(wrapper.find(".question-panel-stub").exists()).toBe(false);
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

  it("renders result-pending state when loaded without current question", () => {
    const wrapper = mountTemplate({ question: null });

    expect(wrapper.get(".questionnaire-template__pending").text()).toContain(
      "Resultaat bepalen...",
    );
    expect(wrapper.find(".question-panel-stub").exists()).toBe(false);
  });

  it("relays panel and popover events", async () => {
    const wrapper = mountTemplate();

    await wrapper.get(".back").trigger("click");
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

    expect(wrapper.emitted("back")).toHaveLength(1);
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
