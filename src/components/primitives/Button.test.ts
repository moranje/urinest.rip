import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Button from "./Button.vue";

describe("Button primitive", () => {
  it("renders slot content as the label", () => {
    const wrapper = mount(Button, { slots: { default: "Save" } });
    expect(wrapper.text()).toContain("Save");
  });

  it("applies variant classes", () => {
    const wrapper = mount(Button, { props: { variant: "outlined" }, slots: { default: "X" } });
    expect(wrapper.classes()).toContain("btn--outlined");
  });

  it("disables the button when disabled prop is set", () => {
    const wrapper = mount(Button, { props: { disabled: true }, slots: { default: "X" } });
    expect((wrapper.element as HTMLButtonElement).disabled).toBe(true);
  });

  it("disables and signals busy when loading", () => {
    const wrapper = mount(Button, { props: { loading: true }, slots: { default: "X" } });
    expect((wrapper.element as HTMLButtonElement).disabled).toBe(true);
    expect(wrapper.attributes("aria-busy")).toBe("true");
    expect(wrapper.find(".btn-spinner").exists()).toBe(true);
  });

  it("emits click via native event", async () => {
    const wrapper = mount(Button, { slots: { default: "X" } });
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toBeTruthy();
  });

  it("renders leading and trailing slots", () => {
    const wrapper = mount(Button, {
      slots: { default: "Go", leading: '<span class="L"/>', trailing: '<span class="T"/>' },
    });
    expect(wrapper.find(".L").exists()).toBe(true);
    expect(wrapper.find(".T").exists()).toBe(true);
  });

  it("keeps every size at the minimum touch target", () => {
    const source = readFileSync("src/components/primitives/Button.vue", "utf8");
    const smallCss = source.match(/\.btn--sm\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? "";
    const mediumCss = source.match(/\.btn--md\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? "";

    expect(source).toContain("min-height: var(--min-touch-target)");
    expect(smallCss).not.toMatch(/min-height:\s*(3[0-9]|4[0-3])px/);
    expect(mediumCss).not.toMatch(/min-height:\s*(3[0-9]|4[0-3])px/);
  });
});
