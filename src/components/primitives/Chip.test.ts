import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Chip from "./Chip.vue";

describe("Chip primitive", () => {
  it("renders filled text chips", () => {
    const wrapper = mount(Chip, {
      props: { icon: "file-text" },
      slots: { default: "Lokale bron" },
    });

    expect(wrapper.element.tagName).toBe("SPAN");
    expect(wrapper.classes()).toContain("chip--filled");
    expect(wrapper.text()).toContain("Lokale bron");
  });

  it("renders safe external link chips by default", () => {
    const wrapper = mount(Chip, {
      props: {
        href: "https://example.test/source",
        variant: "outlined",
        icon: "file-text",
      },
      slots: { default: "Bron bekijken" },
    });

    const link = wrapper.get("a");
    expect(link.classes()).toContain("chip--outlined");
    expect(link.attributes("href")).toBe("https://example.test/source");
    expect(link.attributes("target")).toBe("_blank");
    expect(link.attributes("rel")).toBe("noopener noreferrer");
  });

  it("uses the central touch target token", () => {
    const source = readFileSync("src/components/primitives/Chip.vue", "utf8");
    const chipCss = source.match(/\.chip\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? "";

    expect(chipCss).toContain("min-height: var(--min-touch-target)");
    expect(chipCss).not.toMatch(/min-height:\s*(?:3[0-9]|4[0-3])px/);
  });
});
