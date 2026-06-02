import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ContraindicationGate from "./ContraindicationGate.vue";
import type { Contraindication } from "../../types";

const contraindications: Contraindication[] = [
  { id: "renal", text: "Controleer nierfunctie" },
  { id: "allergy", text: "Controleer allergie" },
];

describe("ContraindicationGate", () => {
  it("hides treatment until every contraindication is checked", async () => {
    const wrapper = mount(ContraindicationGate, {
      props: {
        contraindications,
        treatment: "Nitrofurantoine 5 dagen.",
      },
    });

    expect(wrapper.get(".section-title").text()).toBe("Controleer Contra-indicaties");
    expect(wrapper.find(".treatment-section").exists()).toBe(false);
    expect(wrapper.get(".notice").text()).toContain(
      "Behandeling wordt getoond na controle van contra-indicaties.",
    );
    expect(wrapper.get(".sr-only").text()).toBe(
      "Behandeling verborgen tot alle contra-indicaties zijn gecontroleerd.",
    );

    const checkboxes = wrapper.findAll<HTMLInputElement>(".md-checkbox");
    await checkboxes[0]?.setValue(true);
    expect(wrapper.find(".treatment-section").exists()).toBe(false);

    await checkboxes[1]?.setValue(true);
    expect(wrapper.find(".notice").exists()).toBe(false);
    expect(wrapper.get(".treatment-section").text()).toContain("Nitrofurantoine 5 dagen.");
    expect(wrapper.get(".sr-only").text()).toBe(
      "Behandeling beschikbaar na controle van contra-indicaties.",
    );
  });

  it("shows treatment immediately when no contraindications are present", () => {
    const wrapper = mount(ContraindicationGate, {
      props: {
        treatment: "Afwachtend beleid.",
      },
    });

    expect(wrapper.find(".contraindications-section").exists()).toBe(false);
    expect(wrapper.find(".notice").exists()).toBe(false);
    expect(wrapper.get(".treatment-section").text()).toContain("Afwachtend beleid.");
  });

  it("resets checked state when the contraindication set changes", async () => {
    const wrapper = mount(ContraindicationGate, {
      props: {
        contraindications,
        treatment: "Trimethoprim 3 dagen.",
      },
    });

    for (const checkbox of wrapper.findAll<HTMLInputElement>(".md-checkbox")) {
      await checkbox.setValue(true);
    }
    expect(wrapper.find(".notice").exists()).toBe(false);

    await wrapper.setProps({
      contraindications: [{ id: "pregnancy", text: "Controleer zwangerschap" }],
    });

    expect(wrapper.get(".notice").text()).toContain("Behandeling wordt getoond");
    expect(wrapper.get<HTMLInputElement>(".md-checkbox").element.checked).toBe(false);
  });

  it("renders checklist without treatment messaging when treatment is absent", () => {
    const wrapper = mount(ContraindicationGate, {
      props: {
        contraindications,
      },
    });

    expect(wrapper.findAll(".md-checkbox")).toHaveLength(2);
    expect(wrapper.find(".notice").exists()).toBe(false);
    expect(wrapper.find(".treatment-section").exists()).toBe(false);
    expect(wrapper.find(".sr-only").exists()).toBe(false);
  });
});
