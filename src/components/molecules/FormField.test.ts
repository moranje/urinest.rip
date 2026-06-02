import { h } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import FormField from "./FormField.vue";

describe("FormField", () => {
  it("provides stable control ids and hint description ids to the default slot", () => {
    const wrapper = mount(FormField, {
      props: {
        id: "email",
        label: "E-mail",
        hint: "Gebruik het zakelijke adres.",
      },
      slots: {
        default: ({ fieldId, describedBy }) =>
          h("input", { id: fieldId, "aria-describedby": describedBy }),
      },
    });

    expect(wrapper.get("label").attributes("for")).toBe("email");
    expect(wrapper.get("input").attributes("id")).toBe("email");
    expect(wrapper.get("input").attributes("aria-describedby")).toBe("email-hint");
    expect(wrapper.get("#email-hint").text()).toBe("Gebruik het zakelijke adres.");
  });

  it("prioritizes errors over hints and exposes them as alerts", () => {
    const wrapper = mount(FormField, {
      props: {
        id: "name",
        label: "Naam",
        hint: "Optioneel",
        error: "Naam is verplicht.",
      },
      slots: {
        default: ({ fieldId, describedBy, error }) =>
          h("input", {
            id: fieldId,
            "aria-describedby": describedBy,
            "aria-invalid": error ? "true" : undefined,
          }),
      },
    });

    expect(wrapper.get("input").attributes("aria-describedby")).toBe("name-error");
    expect(wrapper.get("input").attributes("aria-invalid")).toBe("true");
    expect(wrapper.get('[role="alert"]').text()).toBe("Naam is verplicht.");
    expect(wrapper.find("#name-hint").exists()).toBe(false);
  });

  it("renders grouped controls as a disabled fieldset", () => {
    const wrapper = mount(FormField, {
      props: {
        id: "role",
        label: "Rol",
        variant: "group",
        disabled: true,
        required: true,
      },
      slots: {
        default: ({ fieldId }) => h("input", { id: `${fieldId}-arts`, type: "radio" }),
      },
    });

    expect(wrapper.get("fieldset").attributes("disabled")).toBeDefined();
    expect(wrapper.get("legend").text()).toBe("Rol *");
    expect(wrapper.get("input").attributes("id")).toBe("role-arts");
  });
});
