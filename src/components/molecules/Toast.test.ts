import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Toast from "./Toast.vue";

describe("Toast", () => {
  it("renders non-error toast messages as polite status updates", () => {
    const wrapper = mount(Toast, {
      props: {
        level: "success",
        message: "Gekopieerd naar het klembord.",
      },
    });

    expect(wrapper.attributes("role")).toBe("status");
    expect(wrapper.attributes("aria-live")).toBe("polite");
    expect(wrapper.classes()).toContain("notice--success");
    expect(wrapper.text()).toContain("Gekopieerd naar het klembord.");
  });

  it("renders errors as assertive alerts", () => {
    const wrapper = mount(Toast, {
      props: {
        level: "error",
        message: "Opslaan mislukt.",
      },
    });

    expect(wrapper.attributes("role")).toBe("alert");
    expect(wrapper.attributes("aria-live")).toBe("assertive");
    expect(wrapper.classes()).toContain("notice--error");
  });

  it("emits dismiss from the molecule close control", async () => {
    const wrapper = mount(Toast, {
      props: {
        level: "info",
        message: "Nieuwe melding.",
      },
    });

    await wrapper.get('[data-testid="toast-close"]').trigger("click");

    expect(wrapper.emitted("dismiss")).toHaveLength(1);
  });

  it("keeps long toast copy tokenized and wrapping", () => {
    const source = readFileSync("src/components/molecules/Toast.vue", "utf8");

    expect(source).toContain("<Notice");
    expect(source).toContain("<IconButton");
    expect(source).toContain("--notice-padding-block: var(--spacing-md)");
    expect(source).toContain("--notice-padding-inline: var(--spacing-md)");
    expect(source).toContain("overflow-wrap: anywhere");
    expect(source).not.toContain("toast--success");
    expect(source).not.toContain("toast--error");
    expect(source).not.toContain("toast--warning");
    expect(source).not.toContain("toast--info");
  });
});
