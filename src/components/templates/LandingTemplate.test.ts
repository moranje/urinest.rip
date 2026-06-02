import { readFileSync } from "node:fs";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import LandingTemplate from "./LandingTemplate.vue";
import type { Component } from "vue";
import type { BeslismodelLandingMenuSource } from "@beslismodel/vue";

const items: BeslismodelLandingMenuSource[] = [
  {
    id: "strip",
    title: "Urinestrip",
    icon: "strip",
    metadata: { landingOrder: 10, landingSection: "primary" },
  },
  {
    id: "kweek",
    title: "Urinekweek",
    name: "Kweek",
    icon: "culture",
    metadata: { landingOrder: 20 },
  },
  {
    id: "bacteriurie",
    title: "Bacteriurie",
    description: "Diagnose en behandeling",
    metadata: {
      landingDescription: "Diagnose & behandeling",
      landingOrder: 100,
      landingSection: "secondary",
    },
  },
];

const iconStub: Component = {
  props: ["hover", "touch"],
  template: `<span class="icon-stub" :data-hover="String(hover)" :data-touch="String(touch)" />`,
};

const menuItemStub = {
  props: ["to", "name"],
  template: `
    <a class="menu-item-stub" :href="to" :data-name="name">
      <slot :hover="false" :touch="false" />
    </a>
  `,
};

const routerLinkStub = {
  props: ["to"],
  template: `<a class="router-link-stub" :href="to"><slot /></a>`,
};

function mountTemplate() {
  return mount(LandingTemplate, {
    props: {
      items,
      iconKeys: ["strip", "culture"],
      title: "Beslishulp urineonderzoek - kies een test",
      label: "Beslishulp urineonderzoek",
      secondaryHeading: "Urineweginfecties",
      questionnairePath: (id: string) => `/questionnaire/${id}`,
      iconComponent: (icon: string | undefined) => (icon ? iconStub : null),
    },
    global: {
      stubs: {
        MenuItem: menuItemStub,
        RouterLink: routerLinkStub,
      },
    },
  });
}

describe("LandingTemplate", () => {
  it("renders accessible title and manifest-driven primary tiles", () => {
    const wrapper = mountTemplate();

    expect(wrapper.get(".sr-only").text()).toBe("Beslishulp urineonderzoek - kies een test");
    expect(wrapper.get("section").attributes("aria-label")).toBe("Beslishulp urineonderzoek");
    expect(wrapper.findAll(".menu-item-stub").map((item) => item.attributes("href"))).toEqual([
      "/questionnaire/strip",
      "/questionnaire/kweek",
    ]);
    expect(wrapper.findAll(".menu-item-stub").map((item) => item.attributes("data-name"))).toEqual([
      "Urinestrip",
      "Kweek",
    ]);
    expect(wrapper.findAll(".icon-stub")).toHaveLength(2);
  });

  it("renders secondary tiles with route, label, and description", () => {
    const wrapper = mountTemplate();
    const secondary = wrapper.get(".landing-template__secondary-tile");

    expect(wrapper.get(".bm-landing-menu-grid__secondary-heading").text()).toBe(
      "Urineweginfecties",
    );
    expect(secondary.attributes("href")).toBe("/questionnaire/bacteriurie");
    expect(wrapper.get(".landing-template__secondary-title").text()).toBe("Bacteriurie");
    expect(wrapper.get(".landing-template__secondary-description").text()).toBe(
      "Diagnose & behandeling",
    );
  });

  it("keeps the desktop landing grid flat and bounded", () => {
    const source = readFileSync("src/components/templates/LandingTemplate.vue", "utf8");

    expect(source).not.toContain("28vw");
    expect(source).not.toContain("@container landing (max-width: 56.25rem)");
    expect(source).toContain("bm-landing-menu-grid__primary");
    expect(source).toContain("--landing-tile-size: clamp(16rem, 18vw, 20rem)");
    expect(source).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(source).toContain("@container landing (max-width: 44rem)");
    expect(source).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(source).toContain("max-inline-size: var(--landing-tile-size)");
  });
});
