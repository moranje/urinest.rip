import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SegmentedControl from "./SegmentedControl.vue";

const options = [
  { value: "arts", label: "Arts" },
  { value: "triage", label: "Triage" },
  { value: "poh", label: "POH", disabled: true },
] as const;

describe("SegmentedControl", () => {
  it("renders radiogroup options with active state", () => {
    const wrapper = mount(SegmentedControl, {
      props: {
        label: "Rol",
        modelValue: "arts",
        options,
      },
    });

    expect(wrapper.attributes("role")).toBe("radiogroup");
    expect(wrapper.attributes("aria-label")).toBe("Rol");
    expect(wrapper.attributes("style")).toContain("--segmented-control-count: 3");
    expect(wrapper.attributes("style")).toContain("--segmented-control-index: 0");
    expect(
      wrapper.findAll('[role="radio"]').map((node) => node.attributes("aria-checked")),
    ).toEqual(["true", "false", "false"]);
    expect(wrapper.findAll("button").map((node) => node.attributes("tabindex"))).toEqual([
      "0",
      "-1",
      "-1",
    ]);
  });

  it("emits selected values", async () => {
    const wrapper = mount(SegmentedControl, {
      props: {
        label: "Rol",
        modelValue: "arts",
        options,
      },
    });

    await wrapper.findAll("button")[1].trigger("click");
    await wrapper.findAll("button")[2].trigger("click");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["triage"]);
    expect(wrapper.emitted("update:modelValue")).toHaveLength(1);
  });

  it("supports keyboard radio navigation", async () => {
    const wrapper = mount(SegmentedControl, {
      props: {
        label: "Rol",
        modelValue: "arts",
        options,
      },
    });

    await wrapper.findAll("button")[0].trigger("keydown", { key: "ArrowRight" });
    await wrapper.findAll("button")[0].trigger("keydown", { key: "ArrowLeft" });
    await wrapper.findAll("button")[0].trigger("keydown", { key: "End" });
    await wrapper.findAll("button")[1].trigger("keydown", { key: "Home" });

    expect(wrapper.emitted("update:modelValue")).toEqual([
      ["triage"],
      ["triage"],
      ["triage"],
      ["arts"],
    ]);
  });

  it("supports icon-only labels with accessible names", () => {
    const wrapper = mount(SegmentedControl, {
      props: {
        iconOnly: true,
        label: "Thema",
        modelValue: "system",
        options: [
          { value: "system", label: "Systeem", ariaLabel: "Systeemthema", icon: "monitor" },
          { value: "dark", label: "Donker", ariaLabel: "Donker thema", icon: "moon" },
        ],
      },
    });

    expect(wrapper.find('[aria-label="Systeemthema"]').exists()).toBe(true);
    expect(wrapper.find(".segmented-control__text--hidden").text()).toBe("Systeem");
  });

  it("supports long labels with optional wrapping class", () => {
    const wrapper = mount(SegmentedControl, {
      props: {
        wrapLabels: true,
        label: "Zorgrol",
        modelValue: "doktersassistent",
        options: [
          { value: "doktersassistent", label: "Doktersassistent triage en vervolgonderzoek" },
          { value: "praktijkondersteuner", label: "Praktijkondersteuner chronische zorg" },
        ],
      },
    });

    expect(wrapper.classes()).toContain("segmented-control--wrap-labels");
    expect(wrapper.find(".segmented-control__text").text()).toBe(
      "Doktersassistent triage en vervolgonderzoek",
    );
    expect(wrapper.attributes("style")).toContain("--segmented-control-index: 0");
  });

  it("keeps the active indicator flat without glow", () => {
    const source = readFileSync("src/components/molecules/SegmentedControl.vue", "utf8");
    const indicatorCss = source.match(/\.segmented-control::before\s*\{(?<body>[\s\S]*?)\n\}/)
      ?.groups?.body;
    const activeCss = source.match(/\.segmented-control__option--active\s*\{(?<body>[\s\S]*?)\n\}/)
      ?.groups?.body;

    expect(indicatorCss).toBeDefined();
    expect(indicatorCss).not.toContain("box-shadow");
    expect(activeCss).toBeDefined();
    expect(activeCss).not.toContain("text-shadow");
  });
});
