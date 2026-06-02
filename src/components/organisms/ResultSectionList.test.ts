import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ResultSectionList from "./ResultSectionList.vue";
import type { ResultData } from "../../types";

const result: ResultData = {
  title: "Behandeladvies",
  description: "Korte samenvatting voor de gebruiker.",
  urgency: "U1",
  additionalTests: "Verricht urinekweek.",
  warnings: "Controleer alarmsymptomen.",
  testAfterTreatment: "Controle na 48 uur.",
  explainer: "Leg uit dat klachten meestal snel verbeteren.",
  sources: [
    { name: "NHG-Standaard", url: "https://example.test/nhg" },
    { name: "Lokaal protocol" },
  ],
};

describe("ResultSectionList", () => {
  it("renders result sections with urgency and sources", () => {
    const wrapper = mount(ResultSectionList, {
      props: { result },
      slots: {
        "after-additional": '<div class="result-section">Contra-indicaties slot</div>',
        default: '<div class="result-section">Documentatie slot</div>',
      },
    });

    expect(wrapper.get("h1").text()).toBe("Behandeladvies");
    expect(wrapper.get(".result-description").text()).toBe("Korte samenvatting voor de gebruiker.");
    expect(wrapper.get(".status-badge").classes()).toContain("status-badge--u1");
    expect(wrapper.get(".status-badge").attributes("role")).toBe("status");
    expect(wrapper.get(".status-badge").attributes("aria-label")).toBe("Urgentie U1 - spoed");
    expect(wrapper.text()).toContain("Verricht urinekweek.");
    expect(wrapper.get(".notice").attributes("role")).toBe("alert");
    expect(wrapper.text()).toContain("Controleer alarmsymptomen.");
    expect(wrapper.text()).toContain("Controle na 48 uur.");
    expect(wrapper.text()).toContain("Leg uit dat klachten meestal snel verbeteren.");
    expect(wrapper.get(".notice").classes()).not.toContain("result-section");

    const sourceLinks = wrapper.findAll(".source-chip");
    expect(sourceLinks).toHaveLength(2);
    expect(sourceLinks[0]?.text()).toContain("NHG-Standaard");
    expect(sourceLinks[1]?.text()).toContain("Lokaal protocol");
  });

  it("keeps slot content in the clinical section order", () => {
    const wrapper = mount(ResultSectionList, {
      props: { result },
      slots: {
        "after-additional": '<div class="result-section">Contra slot</div>',
        default: '<div class="result-section">Documentatie slot</div>',
      },
    });

    const sectionText = wrapper.findAll(".result-section").map((section) => section.text());

    expect(sectionText[0]).toContain("Behandeladvies");
    expect(sectionText[1]).toContain("Verricht urinekweek.");
    expect(sectionText[2]).toContain("Contra slot");
    expect(wrapper.get(".notice").text()).toContain("Controleer alarmsymptomen.");
    expect(sectionText[3]).toContain("Controle na 48 uur.");
    expect(sectionText[4]).toContain("Leg uit dat klachten meestal snel verbeteren.");
    expect(sectionText[5]).toContain("Documentatie slot");
    expect(sectionText[6]).toContain("Bronnen");
  });

  it("keeps warning notices outside zero-padding result-section wrappers", () => {
    const source = readFileSync("src/components/organisms/ResultSectionList.vue", "utf8");
    const warningNotice = source.match(
      /<Notice\s+v-if="result\.warnings"(?<attrs>[\s\S]*?)role="alert"/,
    )?.groups?.attrs;

    expect(warningNotice).toBeDefined();
    expect(warningNotice).not.toContain("result-section");
  });

  it("omits optional sections when data is absent", () => {
    const wrapper = mount(ResultSectionList, {
      props: {
        result: {
          title: "Alleen titel",
        },
      },
    });

    expect(wrapper.get("h1").text()).toBe("Alleen titel");
    expect(wrapper.find(".status-badge").exists()).toBe(false);
    expect(wrapper.find(".notice").exists()).toBe(false);
    expect(wrapper.find(".sources-list").exists()).toBe(false);
    expect(wrapper.findAll(".result-section")).toHaveLength(1);
  });
});
