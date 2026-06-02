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
    expect(
      wrapper.findAll('[role="radio"]').map((node) => node.attributes("aria-checked")),
    ).toEqual(["true", "false", "false"]);
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

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["triage"]);
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
});
