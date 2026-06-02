import { mount } from "@vue/test-utils";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import OfflineBanner from "./OfflineBanner.vue";

let onlineState = true;

function setOnlineState(value: boolean): void {
  onlineState = value;
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    get: () => onlineState,
  });
}

afterEach(() => {
  setOnlineState(true);
});

describe("OfflineBanner", () => {
  it("renders a status chip when the browser starts offline", async () => {
    setOnlineState(false);
    const wrapper = mount(OfflineBanner);
    await nextTick();

    expect(wrapper.get(".offline-banner").attributes("role")).toBe("status");
    expect(wrapper.get(".chip").text()).toContain("Offline modus");

    wrapper.unmount();
  });

  it("responds to browser online and offline events", async () => {
    setOnlineState(true);
    const wrapper = mount(OfflineBanner);
    await nextTick();

    expect(wrapper.find(".offline-banner").exists()).toBe(false);

    window.dispatchEvent(new Event("offline"));
    await nextTick();
    expect(wrapper.get(".chip").text()).toContain("vragen en resultaten werken nog");

    window.dispatchEvent(new Event("online"));
    await nextTick();
    expect(wrapper.find(".offline-banner").exists()).toBe(false);

    wrapper.unmount();
  });

  it("delegates pill styling to Chip", () => {
    const source = readFileSync("src/components/OfflineBanner.vue", "utf8");
    const bannerCss = source.match(/\.offline-banner\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body;

    expect(source).toContain("<Chip");
    expect(bannerCss).toBeDefined();
    expect(bannerCss).not.toContain("padding:");
    expect(bannerCss).not.toContain("background:");
    expect(bannerCss).not.toContain("border:");
    expect(bannerCss).not.toContain("border-radius:");
  });
});
