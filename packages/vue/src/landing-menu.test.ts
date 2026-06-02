import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { createBeslismodelLandingMenuSections, LandingMenuGrid } from "./landing-menu";

const items = [
  {
    id: "strip",
    title: "Urinestrip",
    icon: "strip",
    metadata: { landingOrder: 20, landingSection: "primary" },
  },
  {
    id: "bacteriurie",
    title: "Urineweginfectie",
    name: "Bacteriurie",
    description: "Long description",
    metadata: {
      landingDescription: "Diagnose & behandeling",
      landingOrder: 110,
      landingSection: "secondary",
    },
  },
  {
    id: "hidden",
    title: "Hidden",
    hiddenFromLandingPage: true,
    metadata: { landingOrder: 1, landingSection: "primary" },
  },
  {
    id: "kweek",
    title: "Urinekweek",
    name: "Kweek",
    icon: "culture",
    metadata: { landingOrder: 50 },
  },
] as const;

describe("landing menu", () => {
  it("groups visible questionnaire metadata into stable landing sections", () => {
    const sections = createBeslismodelLandingMenuSections(items, {
      iconKeys: ["culture", "strip"],
    });

    expect(sections.primary.map((item) => item.id)).toEqual(["strip", "kweek"]);
    expect(sections.secondary.map((item) => item.id)).toEqual(["bacteriurie"]);
    expect(sections.primary[1]).toEqual(
      expect.objectContaining({
        description: "",
        label: "Kweek",
        order: 50,
        section: "primary",
      }),
    );
    expect(sections.secondary[0]).toEqual(
      expect.objectContaining({
        description: "Diagnose & behandeling",
        label: "Bacteriurie",
      }),
    );
  });

  it("renders primary and secondary slots with view items", () => {
    const wrapper = mount(LandingMenuGrid, {
      props: {
        items,
        iconKeys: ["culture", "strip"],
        secondaryHeading: "Urineweginfecties",
      },
      slots: {
        primary: `<template #primary="{ viewItem }"><a class="primary">{{ viewItem.label }}</a></template>`,
        secondary: `<template #secondary="{ viewItem }"><a class="secondary">{{ viewItem.description }}</a></template>`,
      },
    });

    expect(wrapper.findAll(".primary").map((node) => node.text())).toEqual(["Urinestrip", "Kweek"]);
    expect(wrapper.find(".bm-landing-menu-grid__secondary-heading").text()).toBe(
      "Urineweginfecties",
    );
    expect(wrapper.findAll(".secondary").map((node) => node.text())).toEqual([
      "Diagnose & behandeling",
    ]);
  });

  it("prefetches a landing item once on user intent", async () => {
    const prefetchItem = vi.fn();
    const wrapper = mount(LandingMenuGrid, {
      props: {
        items,
        iconKeys: ["culture", "strip"],
        prefetchItem,
      },
      slots: {
        primary: `<template #primary="{ viewItem }"><a class="primary">{{ viewItem.label }}</a></template>`,
      },
    });

    const firstTile = wrapper.get(".bm-landing-menu-grid__primary-item");
    await firstTile.trigger("mouseenter");
    await firstTile.trigger("focusin");
    await firstTile.trigger("touchstart");

    expect(prefetchItem).toHaveBeenCalledTimes(1);
    expect(prefetchItem.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ id: "strip" }));
  });

  it("emits prefetch errors with the matching view item", async () => {
    const error = new Error("prefetch failed");
    const prefetchItem = vi.fn(async () => {
      throw error;
    });
    const wrapper = mount(LandingMenuGrid, {
      props: {
        items,
        iconKeys: ["culture", "strip"],
        prefetchItem,
      },
      slots: {
        primary: `<template #primary="{ viewItem }"><a class="primary">{{ viewItem.label }}</a></template>`,
      },
    });

    await wrapper.get(".bm-landing-menu-grid__primary-item").trigger("mouseenter");
    await flushPromises();

    expect(wrapper.emitted("prefetchError")?.[0]?.[0]).toBe(error);
    expect(wrapper.emitted("prefetchError")?.[0]?.[1]).toEqual(
      expect.objectContaining({ id: "strip" }),
    );
  });
});
