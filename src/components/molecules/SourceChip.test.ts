import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SourceChip from "./SourceChip.vue";

describe("SourceChip", () => {
  it("renders an external source link safely", () => {
    const wrapper = mount(SourceChip, {
      props: {
        name: "NHG Standaard",
        url: "https://example.test/nhg",
      },
    });

    const link = wrapper.get("a");
    expect(link.text()).toContain("NHG Standaard");
    expect(link.attributes("href")).toBe("https://example.test/nhg");
    expect(link.attributes("target")).toBe("_blank");
    expect(link.attributes("rel")).toBe("noopener noreferrer");
    expect(link.classes()).toContain("source-chip--link");
  });

  it("renders a non-link source as text", () => {
    const wrapper = mount(SourceChip, {
      props: {
        name: "Lokale protocolkaart",
      },
    });

    expect(wrapper.find("a").exists()).toBe(false);
    expect(wrapper.get(".source-chip--text").text()).toContain("Lokale protocolkaart");
  });
});
