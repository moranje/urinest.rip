import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CopyAction from "./CopyAction.vue";

function setClipboard(writeText: ReturnType<typeof vi.fn>): void {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

describe("CopyAction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("copies text and emits a status event without exposing copied content", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    const wrapper = mount(CopyAction, {
      props: {
        text: "EPD-regel met klinische inhoud",
        resetDelay: 50,
      },
    });

    await wrapper.get("button").trigger("click");

    expect(writeText).toHaveBeenCalledWith("EPD-regel met klinische inhoud");
    expect(wrapper.emitted("copied")).toEqual([[]]);
    expect(JSON.stringify(wrapper.emitted())).not.toContain("EPD-regel");
    expect(wrapper.text()).toContain("Gekopieerd");

    vi.advanceTimersByTime(50);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Kopieer");
  });

  it("emits clipboard errors without adding copied text to the payload", async () => {
    const error = new Error("clipboard denied");
    const writeText = vi.fn().mockRejectedValue(error);
    setClipboard(writeText);
    const wrapper = mount(CopyAction, {
      props: {
        text: "Niet loggen",
        resetDelay: 50,
      },
    });

    await wrapper.get("button").trigger("click");

    expect(wrapper.emitted("error")?.[0]).toEqual([error]);
    expect(JSON.stringify(wrapper.emitted())).not.toContain("Niet loggen");
    expect(wrapper.text()).toContain("Niet gekopieerd");
  });

  it("disables copying when text is empty", async () => {
    const writeText = vi.fn();
    setClipboard(writeText);
    const wrapper = mount(CopyAction, {
      props: {
        text: "",
      },
    });

    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    await wrapper.get("button").trigger("click");
    expect(writeText).not.toHaveBeenCalled();
  });
});
