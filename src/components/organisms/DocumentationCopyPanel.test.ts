import { mount } from "@vue/test-utils";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import DocumentationCopyPanel from "./DocumentationCopyPanel.vue";

const copyActionStub = {
  props: ["text"],
  emits: ["copied", "error"],
  template: `
    <button
      class="copy-action-stub"
      type="button"
      :data-text="text"
      @click="$emit('copied')"
      @keydown.escape="$emit('error', 'copy failed')"
    >
      Kopieer
    </button>
  `,
};

describe("DocumentationCopyPanel", () => {
  it("delegates framed documentation styling to Card", () => {
    const source = readFileSync("src/components/organisms/DocumentationCopyPanel.vue", "utf8");
    const contentCss =
      source.match(/\.documentation-content\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? "";

    expect(source).toContain("<Card");
    expect(contentCss).not.toContain("border:");
    expect(contentCss).not.toContain("background-color:");
    expect(contentCss).not.toContain("border-radius:");
  });

  it("renders trimmed documentation and delegates copy text", () => {
    const wrapper = mount(DocumentationCopyPanel, {
      props: {
        text: "  SOEP regel\nBeleid  ",
      },
      global: {
        stubs: { CopyAction: copyActionStub },
      },
    });

    expect(wrapper.get(".section-title").text()).toBe("Documenteer (voor EPD)");
    expect(wrapper.get(".documentation-text").text()).toBe("SOEP regel\nBeleid");
    expect(wrapper.get(".copy-action-stub").attributes("data-text")).toBe("SOEP regel\nBeleid");
  });

  it("emits copy status without exposing documentation in payloads", async () => {
    const wrapper = mount(DocumentationCopyPanel, {
      props: {
        text: "Niet loggen",
      },
      global: {
        stubs: { CopyAction: copyActionStub },
      },
    });

    await wrapper.get(".copy-action-stub").trigger("click");
    await wrapper.get(".copy-action-stub").trigger("keydown.escape");

    expect(wrapper.emitted("copied")).toEqual([[]]);
    expect(JSON.stringify(wrapper.emitted())).not.toContain("Niet loggen");
    expect(wrapper.emitted("error")?.[0]).toEqual(["copy failed"]);
  });

  it("does not render empty documentation", () => {
    const wrapper = mount(DocumentationCopyPanel, {
      props: {
        text: "   ",
      },
      global: {
        stubs: { CopyAction: copyActionStub },
      },
    });

    expect(wrapper.find(".documentation-section").exists()).toBe(false);
  });
});
