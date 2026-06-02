import { readFileSync } from "node:fs";
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
    expect(wrapper.get(".notice__title").text()).toBe("Controle nodig");
    expect(wrapper.get(".notice").classes()).not.toContain("result-section");
    expect(wrapper.get(".notice").text()).toContain(
      "Controleer alle contra-indicaties voordat behandeling wordt getoond.",
    );
    expect(wrapper.get(".sr-only").text()).toBe(
      "Behandeling verborgen tot alle contra-indicaties zijn gecontroleerd.",
    );

    const checkboxes = wrapper.findAll<HTMLInputElement>(".checkbox-field__control");
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

    for (const checkbox of wrapper.findAll<HTMLInputElement>(".checkbox-field__control")) {
      await checkbox.setValue(true);
    }
    expect(wrapper.find(".notice").exists()).toBe(false);

    await wrapper.setProps({
      contraindications: [{ id: "pregnancy", text: "Controleer zwangerschap" }],
    });

    expect(wrapper.get(".notice").text()).toContain(
      "Controleer alle contra-indicaties voordat behandeling wordt getoond.",
    );
    expect(wrapper.get<HTMLInputElement>(".checkbox-field__control").element.checked).toBe(false);
  });

  it("renders checklist without treatment messaging when treatment is absent", () => {
    const wrapper = mount(ContraindicationGate, {
      props: {
        contraindications,
      },
    });

    expect(wrapper.findAll(".checkbox-field__control")).toHaveLength(2);
    expect(wrapper.find(".notice").exists()).toBe(false);
    expect(wrapper.find(".treatment-section").exists()).toBe(false);
    expect(wrapper.find(".sr-only").exists()).toBe(false);
  });

  it("keeps status notice padding owned by the Notice primitive", () => {
    const source = readFileSync("src/components/organisms/ContraindicationGate.vue", "utf8");
    const noticeAttrs = source.match(
      /<Notice\s+v-else-if="!allChecked && treatmentText"(?<attrs>[\s\S]*?)role="status"/,
    )?.groups?.attrs;

    expect(noticeAttrs).toBeDefined();
    expect(noticeAttrs).not.toContain("result-section");
  });

  it("delegates treatment card styling to Card", () => {
    const source = readFileSync("src/components/organisms/ContraindicationGate.vue", "utf8");
    const treatmentCss =
      source.match(/\.treatment-section\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? "";

    expect(source).toContain("<Card");
    expect(source).toContain('variant="accent"');
    expect(treatmentCss).not.toContain("border:");
    expect(treatmentCss).not.toContain("background:");
    expect(treatmentCss).not.toContain("border-radius:");
  });
});
