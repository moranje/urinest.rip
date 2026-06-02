import { mount } from "@vue/test-utils";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import PageShell from "./PageShell.vue";

vi.mock("../organisms/AppHeader.vue", () => ({
  default: {
    props: ["dropletAnimate"],
    template: `<header class="app-header-stub" :data-animate="String(dropletAnimate)" />`,
  },
}));

vi.mock("../primitives/Button.vue", () => ({
  default: {
    emits: ["click"],
    template: `<button class="button-stub" type="button" @click="$emit('click')"><slot /></button>`,
  },
}));

vi.mock("../OfflineBanner.vue", () => ({
  default: { template: `<div class="offline-banner-stub" />` },
}));

vi.mock("../ToastContainer.vue", () => ({
  default: { template: `<div class="toast-container-stub" />` },
}));

vi.mock("../UpdatePrompt.vue", () => ({
  default: { template: `<div class="update-prompt-stub" />` },
}));

describe("PageShell", () => {
  it("renders app landmarks, header, overlays, and routed content", () => {
    const wrapper = mount(PageShell, {
      props: {
        dropletAnimate: true,
      },
      slots: {
        default: '<section class="route-content">Route content</section>',
      },
    });

    expect(wrapper.find("#app").exists()).toBe(true);
    expect(wrapper.get(".skip-link").attributes("href")).toBe("#main-content");
    expect(wrapper.get(".app-header-stub").attributes("data-animate")).toBe("true");
    expect(wrapper.get("main").attributes("id")).toBe("main-content");
    expect(wrapper.get("main").attributes("tabindex")).toBe("-1");
    expect(wrapper.get(".route-content").text()).toBe("Route content");
    expect(wrapper.find(".app-error").exists()).toBe(false);
    expect(wrapper.find(".offline-banner-stub").exists()).toBe(true);
    expect(wrapper.find(".toast-container-stub").exists()).toBe(true);
    expect(wrapper.find(".update-prompt-stub").exists()).toBe(true);
  });

  it("shows the app error fallback and emits reload", async () => {
    const wrapper = mount(PageShell, {
      props: {
        appError: "De applicatie kon dit onderdeel niet tonen.",
      },
      slots: {
        default: '<section class="route-content">Verborgen route</section>',
      },
    });

    expect(wrapper.get(".app-error").attributes("role")).toBe("alert");
    expect(wrapper.get(".app-error").attributes("aria-live")).toBe("assertive");
    expect(wrapper.get(".notice__title").text()).toBe("Er ging iets mis");
    expect(wrapper.get(".app-error").text()).toContain(
      "De applicatie kon dit onderdeel niet tonen.",
    );
    expect(wrapper.find(".route-content").exists()).toBe(false);

    await wrapper.get(".button-stub").trigger("click");

    expect(wrapper.emitted("reload")).toHaveLength(1);
  });

  it("delegates app error styling to Notice", () => {
    const source = readFileSync("src/components/templates/PageShell.vue", "utf8");
    const errorCss = source.match(/\.app-error\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? "";

    expect(source).toContain("<Notice");
    expect(source).toContain('variant="error"');
    expect(errorCss).not.toContain("padding:");
    expect(errorCss).not.toContain("border:");
    expect(errorCss).not.toContain("background:");
  });
});
