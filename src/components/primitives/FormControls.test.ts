import { mount } from "@vue/test-utils";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import Checkbox from "./Checkbox.vue";
import IconButton from "./IconButton.vue";
import Input from "./Input.vue";
import Radio from "./Radio.vue";
import Select from "./Select.vue";
import Tooltip from "./Tooltip.vue";

describe("form primitives", () => {
  it("renders icon buttons with accessible labels and variants", () => {
    const wrapper = mount(IconButton, {
      props: {
        ariaLabel: "Instellingen",
        icon: "settings",
        variant: "outlined",
      },
    });

    expect(wrapper.get("button").attributes("aria-label")).toBe("Instellingen");
    expect(wrapper.get("button").classes()).toContain("icon-button--outlined");
  });

  it("keeps small icon buttons at the minimum touch target", () => {
    const source = readFileSync("src/components/primitives/IconButton.vue", "utf8");
    const smallCss =
      source.match(/\.icon-button--sm\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? "";

    expect(smallCss).toContain("min-width: var(--min-touch-target)");
    expect(smallCss).toContain("min-height: var(--min-touch-target)");
    expect(smallCss).not.toMatch(/min-(?:width|height):\s*(3[0-9]|4[0-3])px/);
  });

  it("emits input value updates and links support text", async () => {
    const wrapper = mount(Input, {
      props: {
        id: "field-email",
        label: "E-mail",
        hint: "Gebruik werkmail",
        modelValue: "",
      },
    });

    expect(wrapper.get("label").attributes("for")).toBe("field-email");
    expect(wrapper.get("input").attributes("aria-describedby")).toBe("field-email-hint");

    await wrapper.get("input").setValue("arts@example.test");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["arts@example.test"]);
  });

  it("renders select options and emits selected value", async () => {
    const wrapper = mount(Select, {
      props: {
        id: "role",
        label: "Rol",
        modelValue: "",
        options: [
          { value: "arts", label: "Arts" },
          { value: "poh", label: "POH" },
        ],
        placeholder: "Kies rol",
      },
    });

    expect(wrapper.findAll("option").map((option) => option.text())).toEqual([
      "Kies rol",
      "Arts",
      "POH",
    ]);

    await wrapper.get("select").setValue("poh");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["poh"]);
  });

  it("renders checkbox labels and emits checked state", async () => {
    const wrapper = mount(Checkbox, {
      props: {
        id: "confirm",
        label: "Gecontroleerd",
        description: "Controleer allergie voor voorschrijven.",
      },
    });

    expect(wrapper.get("input").attributes("aria-describedby")).toBe("confirm-description");

    await wrapper.get("input").setValue(true);

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([true]);
  });

  it("renders radio labels and emits option value", async () => {
    const wrapper = mount(Radio, {
      props: {
        id: "role-arts",
        label: "Arts",
        modelValue: "triagist",
        name: "role",
        value: "arts",
      },
    });

    expect(wrapper.get("input").attributes("checked")).toBeUndefined();

    await wrapper.get("input").setValue(true);

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["arts"]);
  });

  it("toggles default tooltip content and exposes trigger semantics", async () => {
    const wrapper = mount(Tooltip, {
      props: { id: "info-1", ariaLabel: "Vraag toelichting" },
      slots: {
        default: "Vraag alleen bij klachten.",
      },
    });

    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);

    await wrapper.get("button").trigger("click");

    expect(wrapper.get('[role="tooltip"]').text()).toBe("Vraag alleen bij klachten.");
    expect(wrapper.get("button").attributes("aria-describedby")).toBe("info-1");

    await wrapper.get("button").trigger("keydown", { key: "Escape" });

    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
  });
});
