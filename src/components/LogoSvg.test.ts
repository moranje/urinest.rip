import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import LogoSvg from "./LogoSvg.vue";

describe("LogoSvg", () => {
  it("renders an accessible image with stable aspect ratio", () => {
    const wrapper = mount(LogoSvg, { props: { size: 32 } });
    const svg = wrapper.get("svg");

    expect(svg.attributes("role")).toBe("img");
    expect(svg.attributes("aria-label")).toBe("urinest.rip");
    expect(svg.attributes("height")).toBe("32");
    expect(svg.attributes("width")).toBe(String(Math.round(32 * (799 / 193))));
  });

  it("plays and clears the droplet animation when requested", async () => {
    const wrapper = mount(LogoSvg);
    const droplet = wrapper.get(".logo-droplet");

    expect(droplet.classes()).not.toContain("logo-droplet--animate");

    await wrapper.setProps({ animate: true });
    expect(droplet.classes()).toContain("logo-droplet--animate");

    await droplet.trigger("animationend");
    expect(droplet.classes()).not.toContain("logo-droplet--animate");
  });
});
