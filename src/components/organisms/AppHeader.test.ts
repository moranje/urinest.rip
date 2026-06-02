import { readFileSync } from "node:fs";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import AppHeader from "./AppHeader.vue";
import { useAuthStore } from "../../store/authStore";

const routeState = vi.hoisted(() => ({ path: "/" }));

vi.mock("vue-router", () => ({
  useRoute: () => routeState,
}));

const routerLinkStub = {
  props: ["to", "ariaCurrent", "ariaLabel", "title"],
  template: `
    <a
      class="router-link-stub"
      :href="typeof to === 'string' ? to : ''"
      :aria-current="ariaCurrent"
      :aria-label="ariaLabel"
      :title="title"
    >
      <slot />
    </a>
  `,
};

function mountHeader() {
  return mount(AppHeader, {
    global: {
      stubs: {
        RouterLink: routerLinkStub,
        LogoSvg: { template: '<span data-test="logo" />' },
        RoleToggle: { template: '<span data-test="role-toggle" />' },
        ThemeToggle: { template: '<span data-test="theme-toggle" />' },
        Icon: { template: '<span data-test="icon" />' },
      },
    },
  });
}

describe("AppHeader", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routeState.path = "/";
  });

  it("renders home link and primary header controls", () => {
    const wrapper = mountHeader();

    expect(wrapper.get("header").classes()).toContain("app-header");
    expect(wrapper.get('[aria-label="Home"]').attributes("aria-current")).toBe("page");
    expect(wrapper.find('[data-test="role-toggle"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="theme-toggle"]').exists()).toBe(true);
    expect(wrapper.get("nav").attributes("aria-label")).toBe("Hoofdnavigatie");
  });

  it("marks about and admin routes as current when active", () => {
    routeState.path = "/admin/logs";
    const wrapper = mountHeader();

    expect(wrapper.get('[aria-label="Admin"]').attributes("aria-current")).toBe("page");
    expect(
      wrapper.get('[aria-label="Over deze beslishulp"]').attributes("aria-current"),
    ).toBeUndefined();
  });

  it("targets logs when authenticated and login when anonymous", () => {
    const anonymous = mountHeader();
    expect(anonymous.get('[aria-label="Admin"]').attributes("href")).toBe("/admin/login");

    const authStore = useAuthStore();
    authStore.user = { id: "u1" } as never;
    const authenticated = mountHeader();
    expect(authenticated.get('[aria-label="Admin"]').attributes("href")).toBe("/admin/logs");
  });

  it("keeps the logo home link visually quiet", () => {
    const source = readFileSync("src/components/organisms/AppHeader.vue", "utf8");
    const titleLinkCss = source.match(/\.app-title-link\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body;
    const hoverCss = source.match(/\.app-title-link:hover\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body;

    expect(titleLinkCss).toBeDefined();
    expect(titleLinkCss).not.toContain("border-radius");
    expect(titleLinkCss).not.toContain("margin:");
    expect(hoverCss).toBeDefined();
    expect(hoverCss).not.toContain("background");
    expect(hoverCss).toContain("text-decoration");
  });
});
