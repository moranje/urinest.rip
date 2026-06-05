import { readFileSync } from "node:fs";
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import LandingTemplate from "./LandingTemplate.vue";
import type { Component } from "vue";
import type { BeslismodelLandingMenuSource } from "@moranje/beslismodel/vue";

const items: BeslismodelLandingMenuSource[] = [
  {
    id: "healthy",
    title: "Gezonde vrouwen",
    icon: "healthy",
    metadata: { landingOrder: 5, landingSection: "primary" },
  },
  {
    id: "strip",
    title: "Urinestrip",
    icon: "strip",
    metadata: { landingOrder: 10, landingSection: "primary" },
  },
  {
    id: "dipslide",
    title: "Dipslide",
    icon: "dipslide",
    metadata: { landingOrder: 20, landingSection: "primary" },
  },
  {
    id: "sediment",
    title: "Sediment",
    icon: "sediment",
    metadata: { landingOrder: 30, landingSection: "primary" },
  },
  {
    id: "kweek",
    title: "Urinekweek",
    name: "Kweek",
    icon: "culture",
    metadata: { landingOrder: 40, landingSection: "primary" },
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

function cssBlock(source: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    source.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[\\s\\S]*?)\\n\\}`))?.groups?.body ??
    ""
  );
}

function rootSvgAttrs(source: string): string {
  return source.match(/<svg(?<attrs>[\s\S]*?)>/)?.groups?.attrs ?? "";
}

function mountTemplate(
  overrides: Partial<{
    prefetchQuestionnaire: (id: string) => void | Promise<void>;
  }> = {},
) {
  return mount(LandingTemplate, {
    props: {
      items,
      iconKeys: ["healthy", "strip", "dipslide", "sediment", "culture"],
      title: "Beslishulp urineonderzoek - kies een test",
      label: "Beslishulp urineonderzoek",
      secondaryHeading: "Urineweginfecties",
      questionnairePath: (id: string) => `/questionnaire/${id}`,
      iconComponent: (icon: string | undefined) => (icon ? iconStub : null),
      ...overrides,
    },
    global: {
      stubs: {
        MenuItem: menuItemStub,
        RouterLink: routerLinkStub,
      },
    },
  });
}

function findPrimaryItemByPath(wrapper: ReturnType<typeof mountTemplate>, path: string) {
  const link = wrapper.get(`.menu-item-stub[href="${path}"]`);
  const item = wrapper
    .findAll(".bm-landing-menu-grid__primary-item")
    .find((candidate) => candidate.element.contains(link.element));
  if (!item) throw new Error(`Could not find primary landing item: ${path}`);
  return item;
}

describe("LandingTemplate", () => {
  it("renders accessible title and manifest-driven primary tiles", () => {
    const wrapper = mountTemplate();

    expect(wrapper.get(".sr-only").text()).toBe("Beslishulp urineonderzoek - kies een test");
    expect(wrapper.get("section").attributes("aria-label")).toBe("Beslishulp urineonderzoek");
    expect(wrapper.findAll(".menu-item-stub").map((item) => item.attributes("href"))).toEqual([
      "/questionnaire/healthy",
      "/questionnaire/strip",
      "/questionnaire/dipslide",
      "/questionnaire/sediment",
      "/questionnaire/kweek",
    ]);
    expect(wrapper.findAll(".menu-item-stub").map((item) => item.attributes("data-name"))).toEqual([
      "Gezonde vrouwen",
      "Urinestrip",
      "Dipslide",
      "Sediment",
      "Kweek",
    ]);
    expect(wrapper.findAll(".icon-stub")).toHaveLength(5);
  });

  it("renders secondary tiles with route, label, and description", () => {
    const wrapper = mountTemplate();
    const secondaryLink = wrapper.get(".landing-template__secondary-link");

    expect(wrapper.get(".bm-landing-menu-grid__secondary-heading").text()).toBe(
      "Urineweginfecties",
    );
    expect(secondaryLink.attributes("href")).toBe("/questionnaire/bacteriurie");
    expect(wrapper.get(".landing-template__secondary-tile").classes()).toContain("card--outlined");
    expect(wrapper.get(".landing-template__secondary-title").text()).toBe("Bacteriurie");
    expect(wrapper.get(".landing-template__secondary-description").text()).toBe(
      "Diagnose & behandeling",
    );
  });

  it("delegates secondary tile shell styling to the Card primitive", () => {
    const source = readFileSync("src/components/templates/LandingTemplate.vue", "utf8");
    const secondaryTileCss = cssBlock(source, ".landing-template__secondary-tile");

    expect(source).toContain("<Card");
    expect(source).toContain('variant="outlined"');
    expect(secondaryTileCss).not.toContain("padding:");
    expect(secondaryTileCss).not.toContain("border:");
    expect(secondaryTileCss).not.toContain("border-radius:");
    expect(secondaryTileCss).not.toContain("background:");
  });

  it("keeps the desktop landing grid at 2 rows by 3 columns", () => {
    const source = readFileSync("src/components/templates/LandingTemplate.vue", "utf8");
    const primaryGridCss = cssBlock(source, ":deep(.bm-landing-menu-grid__primary)");
    const compactCss = source.match(
      /@container landing \(max-width: 44rem\)\s*\{(?<body>[\s\S]*?)\n\}/,
    )?.groups?.body;

    expect(source).not.toContain("28vw");
    expect(source).not.toContain("@container landing (max-width: 56.25rem)");
    expect(source).not.toContain("--spacing-2xl");
    expect(source).toContain("bm-landing-menu-grid__primary");
    expect(source).toContain("--landing-tile-size: clamp(16rem, 18vw, 20rem)");
    expect(primaryGridCss).toContain("five primary flows render as 2 rows x 3 columns");
    expect(primaryGridCss).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(items.filter((item) => item.metadata?.landingSection !== "secondary")).toHaveLength(5);
    expect(source).toContain("@container landing (max-width: 44rem)");
    expect(compactCss).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(source).toContain("max-inline-size: var(--landing-tile-size)");
  });

  it("keeps landing menu tiles dimensionally stable", () => {
    const landingTemplate = readFileSync("src/components/templates/LandingTemplate.vue", "utf8");
    const menuItem = readFileSync("src/components/MenuItem.vue", "utf8");
    const cultureSvg = readFileSync("src/components/CultureSvg.vue", "utf8");
    const dipslideSvg = readFileSync("src/components/DipslideSvg.vue", "utf8");
    const healthySvg = readFileSync("src/components/HealthySvg.vue", "utf8");
    const sedimentSvg = readFileSync("src/components/SedimentSvg.vue", "utf8");
    const stripSvg = readFileSync("src/components/StripSvg.vue", "utf8");

    const primaryItemCss = cssBlock(landingTemplate, ":deep(.bm-landing-menu-grid__primary-item)");
    const primaryChildCss = cssBlock(
      landingTemplate,
      ":deep(.bm-landing-menu-grid__primary-item > *)",
    );
    const menuItemCss = cssBlock(menuItem, ".menu-item");
    const menuImageCss = cssBlock(menuItem, ".menu-image");
    const menuSvgCss = cssBlock(menuItem, ".menu-image > :deep(svg)");

    expect(primaryItemCss).toContain("inline-size: 100%");
    expect(primaryItemCss).toContain("max-inline-size: var(--landing-tile-size)");
    expect(primaryItemCss).toContain("aspect-ratio: 1 / 1");
    expect(primaryItemCss).toContain("overflow: hidden");
    expect(primaryChildCss).toContain("inline-size: 100%");
    expect(primaryChildCss).toContain("block-size: 100%");
    expect(menuItemCss).toContain("overflow: hidden");
    expect(menuImageCss).toContain("min-height: 0");
    expect(menuImageCss).toContain("overflow: hidden");
    expect(menuSvgCss).toContain("width: 100%");
    expect(menuSvgCss).toContain("height: 100%");
    expect(menuSvgCss).toContain("max-width: 100%");
    expect(menuSvgCss).toContain("max-height: 100%");

    for (const svg of [cultureSvg, dipslideSvg, healthySvg, sedimentSvg, stripSvg]) {
      const attrs = rootSvgAttrs(svg);
      expect(attrs).toContain("viewBox=");
      expect(attrs).not.toMatch(/\swidth=/);
      expect(attrs).not.toMatch(/\sheight=/);
    }
  });

  it("prefetches questionnaire routes through the package landing grid", async () => {
    const prefetchQuestionnaire = vi.fn();
    const wrapper = mountTemplate({ prefetchQuestionnaire });
    const stripItem = findPrimaryItemByPath(wrapper, "/questionnaire/strip");

    await stripItem.trigger("mouseenter");
    await stripItem.trigger("focusin");

    expect(prefetchQuestionnaire).toHaveBeenCalledTimes(1);
    expect(prefetchQuestionnaire).toHaveBeenCalledWith("strip");
  });

  it("emits questionnaire prefetch errors with the questionnaire id", async () => {
    const error = new Error("prefetch failed");
    const wrapper = mountTemplate({
      prefetchQuestionnaire: async () => {
        throw error;
      },
    });
    const stripItem = findPrimaryItemByPath(wrapper, "/questionnaire/strip");

    await stripItem.trigger("mouseenter");
    await flushPromises();

    expect(wrapper.emitted("prefetchError")?.[0]).toEqual([error, "strip"]);
  });
});
