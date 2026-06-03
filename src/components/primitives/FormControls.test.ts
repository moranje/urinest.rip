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

  it("supports template-style aria labels and pressed state on icon buttons", () => {
    const wrapper = mount(IconButton, {
      props: {
        "aria-label": "Wachtwoord tonen",
        ariaPressed: true,
        icon: "eye",
      },
    });

    expect(wrapper.get("button").attributes("aria-label")).toBe("Wachtwoord tonen");
    expect(wrapper.get("button").attributes("aria-pressed")).toBe("true");
  });

  it("renders router links through the icon button primitive", () => {
    const wrapper = mount(IconButton, {
      props: {
        "aria-label": "Over deze beslishulp",
        "aria-current": "page",
        icon: "info-circle",
        title: "Over",
        to: "/over",
      },
      global: {
        stubs: {
          RouterLink: {
            props: {
              to: { type: [String, Object], default: "" },
              custom: { type: Boolean, default: false },
            },
            methods: {
              navigate() {},
            },
            template: `
              <slot
                v-if="custom"
                :href="typeof to === 'string' ? to : ''"
                :navigate="navigate"
              />
            `,
          },
        },
      },
    });

    expect(wrapper.get("a").attributes("href")).toBe("/over");
    expect(wrapper.get("a").attributes("aria-label")).toBe("Over deze beslishulp");
    expect(wrapper.get("a").attributes("aria-current")).toBe("page");
    expect(wrapper.get("a").classes()).toContain("icon-button");
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
        inputmode: "email",
        enterkeyhint: "next",
      },
    });

    expect(wrapper.get("label").attributes("for")).toBe("field-email");
    expect(wrapper.get("input").attributes("aria-describedby")).toBe("field-email-hint");
    expect(wrapper.get("input").attributes("inputmode")).toBe("email");
    expect(wrapper.get("input").attributes("enterkeyhint")).toBe("next");

    await wrapper.get("input").setValue("arts@example.test");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["arts@example.test"]);
  });

  it("links input errors with optional alert role", () => {
    const wrapper = mount(Input, {
      props: {
        id: "field-password",
        label: "Wachtwoord",
        error: "Wachtwoord is verplicht",
        errorRole: "alert",
      },
    });

    expect(wrapper.get("input").attributes("aria-invalid")).toBe("true");
    expect(wrapper.get("input").attributes("aria-describedby")).toBe("field-password-error");
    expect(wrapper.get("#field-password-error").attributes("role")).toBe("alert");
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

  it("renders checkbox visuals without native accent borders", () => {
    const source = readFileSync("src/components/primitives/Checkbox.vue", "utf8");
    const controlCss =
      source.match(/\.checkbox-field__control\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? "";
    const boxCss =
      source.match(/\.checkbox-field__box\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? "";
    const checkedCss =
      source.match(
        /\.checkbox-field__control:checked \+ \.checkbox-field__box\s*\{(?<body>[\s\S]*?)\n\}/,
      )?.groups?.body ?? "";
    const focusCss =
      source.match(
        /\.checkbox-field__control:focus-visible \+ \.checkbox-field__box\s*\{(?<body>[\s\S]*?)\n\}/,
      )?.groups?.body ?? "";

    expect(source).toContain('class="checkbox-field__box"');
    expect(source).toContain("<Icon");
    expect(source).not.toContain(".checkbox-field__box::after");
    expect(controlCss).toContain("appearance: none");
    expect(controlCss).toContain("opacity: 0");
    expect(controlCss).toContain("border: 0");
    expect(controlCss).toContain("outline: 0");
    expect(controlCss).not.toContain("accent-color");
    expect(boxCss).toContain("border: 0");
    expect(boxCss).toContain("border-radius: 999px");
    expect(boxCss).toContain("outline: 0");
    expect(boxCss).toContain("box-shadow: none");
    expect(checkedCss).toContain("color-mix(in srgb, var(--md-sys-color-primary) 18%");
    expect(checkedCss).not.toContain("border:");
    expect(focusCss).not.toContain("box-shadow");
    expect(focusCss).not.toContain("outline");
    expect(source).not.toContain("border-width: 0 3px 3px 0");
    expect(source).toContain(
      ".checkbox-field:has(.checkbox-field__control:focus-visible) .checkbox-field__label",
    );
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
