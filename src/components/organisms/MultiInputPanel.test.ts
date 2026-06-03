import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MultiInputPanel from "./MultiInputPanel.vue";
import type { Answer, Question } from "../../types";

const questions: Question[] = [
  {
    id: "q-age",
    text: "Leeftijd",
    type: "number",
    description: "Jaren",
    options: [],
  },
  {
    id: "q-smoker",
    text: "Rookt de patiënt?",
    type: "boolean",
    options: [],
  },
  {
    id: "q-region",
    text: "Risicoregio",
    type: "select",
    options: [
      { id: "o-low", value: "low", text: "Laag" },
      { id: "o-moderate", value: "moderate", text: "Matig" },
    ],
  },
];

function mountPanel(overrides: Partial<InstanceType<typeof MultiInputPanel>["$props"]> = {}) {
  return mount(MultiInputPanel, {
    props: {
      answers: {},
      hasHistory: true,
      progressMax: 6,
      progressValue: 2,
      questions,
      stepDescription: "Voer alle bekende CVRM-waarden in.",
      title: "CVRM risicogegevens",
      ...overrides,
    },
  });
}

describe("MultiInputPanel", () => {
  it("renders several clinical inputs in one stable form", () => {
    const answers: Record<string, Answer> = {
      "q-age": { value: "70", text: "70" },
      "q-smoker": { value: "false", text: "Nee" },
      "q-region": { value: "moderate", text: "Matig" },
    };
    const wrapper = mountPanel({ answers });

    expect(wrapper.get("h1").text()).toBe("CVRM risicogegevens");
    expect(wrapper.text()).toContain("Voer alle bekende CVRM-waarden in.");
    expect(wrapper.findAll("input, select")).toHaveLength(3);
    expect(wrapper.text()).toContain("3/3 ingevuld");
    expect(wrapper.get("button[type='submit']").attributes("disabled")).toBeUndefined();
  });

  it("emits answer updates with question ids and blocks incomplete submit", async () => {
    const wrapper = mountPanel();

    await wrapper.get("input[type='number']").setValue("65");
    await wrapper.findAll("select")[0]?.setValue("true");
    await wrapper.findAll("select")[1]?.setValue("low");

    expect(wrapper.emitted("update-answer")).toEqual([
      ["q-age", { value: "65", text: "65" }],
      ["q-smoker", { value: "true", text: "Ja" }],
      ["q-region", { value: "low", text: "Laag" }],
    ]);

    await wrapper.get("form").trigger("submit");
    expect(wrapper.emitted("submit")).toBeUndefined();
    expect(wrapper.text()).toContain("Vul deze waarde in.");
  });

  it("submits only when every grouped input has an answer", async () => {
    const wrapper = mountPanel({
      answers: {
        "q-age": { value: "65", text: "65" },
        "q-smoker": { value: "true", text: "Ja" },
        "q-region": { value: "low", text: "Laag" },
      },
    });

    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")).toHaveLength(1);
  });
});
