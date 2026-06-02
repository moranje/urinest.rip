import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import TextLink from "./TextLink.vue";

describe("TextLink primitive", () => {
  it("opens http links safely in a new tab by default", () => {
    const wrapper = mount(TextLink, {
      props: { href: "https://example.test/richtlijn" },
      slots: { default: "Bron" },
    });

    const link = wrapper.get("a");
    expect(link.attributes("href")).toBe("https://example.test/richtlijn");
    expect(link.attributes("target")).toBe("_blank");
    expect(link.attributes("rel")).toBe("noopener noreferrer");
    expect(link.text()).toBe("Bron");
  });

  it("keeps same-origin links in the current tab", () => {
    const wrapper = mount(TextLink, {
      props: { href: "/over" },
      slots: { default: "Over" },
    });

    const link = wrapper.get("a");
    expect(link.attributes("target")).toBeUndefined();
    expect(link.attributes("rel")).toBeUndefined();
  });

  it("uses tokenized text link styling", () => {
    const source = readFileSync("src/components/primitives/TextLink.vue", "utf8");

    expect(source).toContain("color: var(--md-sys-color-primary)");
    expect(source).toContain("outline: 2px solid var(--md-sys-color-primary)");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
