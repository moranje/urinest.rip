import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ResultTemplate from "./ResultTemplate.vue";
import type { ResultData } from "../../types";

const result: ResultData = {
  title: "Beleid bij bacteriurie",
  description: "Langere toelichting voor gebruiker.",
  urgency: "U3",
  additionalTests: "Overweeg kweek.",
  documentation: "SOEP-regel",
  treatment: "Nitrofurantoine 5 dagen.",
  contraindications: [{ id: "renal", text: "Controleer nierfunctie" }],
  sources: [{ name: "NHG-Standaard", url: "https://example.test/nhg" }],
};

const skeletonStub = {
  props: ["variant", "width"],
  template: `<span class="skeleton-stub" :data-variant="variant" :data-width="width" />`,
};

const resultSectionListStub = {
  props: ["result"],
  template: `
    <article class="result-section-list-stub" :data-title="result.title">
      <slot name="after-additional" />
      <slot />
    </article>
  `,
};

const contraindicationGateStub = {
  props: ["contraindications", "treatment"],
  template: `
    <section
      class="contraindication-gate-stub"
      :data-count="contraindications?.length ?? 0"
      :data-treatment="treatment"
    />
  `,
};

const documentationCopyPanelStub = {
  props: ["text"],
  emits: ["copied", "error"],
  template: `
    <section class="documentation-copy-panel-stub" :data-text="text">
      <button class="copy" type="button" @click="$emit('copied')">Kopieer</button>
      <button class="copy-error" type="button" @click="$emit('error', 'copy failed')">
        Fout
      </button>
    </section>
  `,
};

function mountTemplate(overrides: Partial<InstanceType<typeof ResultTemplate>["$props"]> = {}) {
  return mount(ResultTemplate, {
    props: {
      isLoading: false,
      error: null,
      result,
      documentation: "SOEP-regel",
      ...overrides,
    },
    global: {
      stubs: {
        ContraindicationGate: contraindicationGateStub,
        DocumentationCopyPanel: documentationCopyPanelStub,
        ResultSectionList: resultSectionListStub,
        Skeleton: skeletonStub,
      },
    },
  });
}

describe("ResultTemplate", () => {
  it("renders loading skeleton with accessible busy state", () => {
    const wrapper = mountTemplate({ isLoading: true, result: null });

    const content = wrapper.get(".result-template__content");
    expect(content.attributes("aria-busy")).toBe("true");
    expect(content.attributes("aria-label")).toBe("Resultaat laden");
    expect(
      wrapper.findAll(".skeleton-stub").map((item) => item.attributes("data-variant")),
    ).toEqual(["badge", "title", "line", "line", "short", "title", "line", "short"]);
    expect(wrapper.find(".result-section-list-stub").exists()).toBe(false);
  });

  it("renders error state before result content", () => {
    const wrapper = mountTemplate({
      error: "Resultaat niet beschikbaar.",
      result: null,
    });

    expect(wrapper.get(".result-template__error").attributes("role")).toBe("alert");
    expect(wrapper.get(".result-template__error").classes()).toContain("notice--error");
    expect(wrapper.get("h1").text()).toBe("Resultaat niet gevonden");
    expect(wrapper.text()).toContain("Resultaat niet beschikbaar.");
    expect(wrapper.find(".result-section-list-stub").exists()).toBe(false);
  });

  it("delegates result error shell styling to Notice", () => {
    const source = readFileSync("src/components/templates/ResultTemplate.vue", "utf8");
    const errorCss = source.match(/\.result-template__error\s*\{(?<body>[\s\S]*?)\n\}/)?.groups
      ?.body;

    expect(source).toContain("<Notice");
    expect(source).toContain('variant="error"');
    expect(source).toContain('title-tag="h1"');
    expect(errorCss).not.toContain("padding:");
    expect(errorCss).not.toContain("background:");
    expect(errorCss).not.toContain("border:");
  });

  it("renders result content with contraindication and documentation slots", () => {
    const wrapper = mountTemplate();

    expect(wrapper.get("section").attributes("aria-label")).toBe("Resultaat");
    expect(wrapper.find(".back-button").exists()).toBe(false);
    expect(wrapper.get(".result-section-list-stub").attributes("data-title")).toBe(
      "Beleid bij bacteriurie",
    );
    expect(wrapper.get(".contraindication-gate-stub").attributes("data-count")).toBe("1");
    expect(wrapper.get(".contraindication-gate-stub").attributes("data-treatment")).toBe(
      "Nitrofurantoine 5 dagen.",
    );
    expect(wrapper.get(".documentation-copy-panel-stub").attributes("data-text")).toBe(
      "SOEP-regel",
    );
  });

  it("relays documentation copy events", async () => {
    const wrapper = mountTemplate();

    await wrapper.get(".copy").trigger("click");
    await wrapper.get(".copy-error").trigger("click");

    expect(wrapper.emitted("documentationCopied")).toHaveLength(1);
    expect(wrapper.emitted("documentationError")?.[0]).toEqual(["copy failed"]);
  });
});
