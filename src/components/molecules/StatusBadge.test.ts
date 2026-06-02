import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import StatusBadge from "./StatusBadge.vue";

describe("StatusBadge", () => {
  it("renders urgent badges with status semantics", () => {
    const wrapper = mount(StatusBadge, {
      props: {
        variant: "u1",
        size: "md",
        pulse: true,
        role: "status",
        ariaLabel: "Urgentie U1 — spoed",
      },
      slots: { default: "U1" },
    });

    expect(wrapper.text()).toBe("U1");
    expect(wrapper.attributes("role")).toBe("status");
    expect(wrapper.attributes("aria-label")).toBe("Urgentie U1 — spoed");
    expect(wrapper.classes()).toContain("status-badge--u1");
    expect(wrapper.classes()).toContain("status-badge--pulse");
    expect(wrapper.classes()).toContain("motion-pulse-emphasis");
  });

  it("supports log level and resolution variants", () => {
    const error = mount(StatusBadge, {
      props: { variant: "error" },
      slots: { default: "ERROR" },
    });
    const resolved = mount(StatusBadge, {
      props: { variant: "resolved", title: "Opgelost in 1.2.3" },
      slots: { default: "Opgelost" },
    });

    expect(error.classes()).toContain("status-badge--error");
    expect(resolved.classes()).toContain("status-badge--resolved");
    expect(resolved.attributes("title")).toBe("Opgelost in 1.2.3");
  });

  it("keeps pulsing badges quiet when reduced motion is preferred", () => {
    const source = readFileSync("src/styles/motion.css", "utf8");
    expect(source).toContain("@media (prefers-reduced-motion: reduce)");
    expect(source).toContain(".motion-pulse-emphasis");
    expect(source).toContain("animation: none");
  });
});
