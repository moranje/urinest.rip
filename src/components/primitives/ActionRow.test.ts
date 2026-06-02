import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ActionRow from "./ActionRow.vue";

describe("ActionRow primitive", () => {
  it("renders a full-width button row and emits click", async () => {
    const wrapper = mount(ActionRow, {
      slots: { default: "Open loggroep" },
    });

    expect(wrapper.element.tagName).toBe("BUTTON");
    expect(wrapper.text()).toContain("Open loggroep");

    await wrapper.trigger("click");

    expect(wrapper.emitted("click")).toHaveLength(1);
  });

  it("uses the central touch target token", () => {
    const source = readFileSync("src/components/primitives/ActionRow.vue", "utf8");
    const rowCss = source.match(/\.action-row\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? "";

    expect(rowCss).toContain("min-height: var(--min-touch-target)");
    expect(rowCss).not.toMatch(/min-height:\s*(?:3[0-9]|4[0-3])px/);
  });
});
