import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePopover } from "./usePopover";
import type { QuestionOption } from "../types";

const option = (id: string, description = "Toelichting"): QuestionOption =>
  ({
    id,
    text: id,
    value: id,
    description,
  }) as QuestionOption;

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
  });
}

function eventWithRect(rect: Partial<DOMRect>): MouseEvent {
  const target = document.createElement("button");
  target.getBoundingClientRect = vi.fn(
    () =>
      ({
        bottom: rect.bottom ?? 0,
        height: rect.height ?? 0,
        left: rect.left ?? 0,
        right: rect.right ?? 0,
        top: rect.top ?? 0,
        width: rect.width ?? 0,
        x: rect.left ?? 0,
        y: rect.top ?? 0,
        toJSON: () => ({}),
      }) as DOMRect,
  );

  const event = new MouseEvent("mouseenter");
  Object.defineProperty(event, "currentTarget", {
    configurable: true,
    value: target,
  });
  return event;
}

describe("usePopover", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setViewport(800, 600);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts hidden without active option or stale copy", () => {
    const popover = usePopover();

    expect(popover.activePopoverOptionId.value).toBeNull();
    expect(popover.popoverDescription.value).toBe("");
    expect(popover.popoverStyle.value).toEqual({
      left: "0px",
      top: "0px",
      visibility: "hidden",
    });
  });

  it("opens below the trigger when enough vertical space exists", () => {
    const popover = usePopover();

    popover.showPopover(
      option("nitrofurantoine", "1e keuze bij ongecompliceerde cystitis"),
      eventWithRect({ bottom: 100, left: 450, top: 70, width: 40 }),
    );

    expect(popover.activePopoverOptionId.value).toBe("nitrofurantoine");
    expect(popover.popoverDescription.value).toBe("1e keuze bij ongecompliceerde cystitis");
    expect(popover.popoverStyle.value).toMatchObject({
      left: "320px",
      maxWidth: "300px",
      opacity: 1,
      position: "fixed",
      top: "105px",
      visibility: "visible",
    });
  });

  it("opens above the trigger and keeps the top inside the viewport", () => {
    const popover = usePopover();
    setViewport(800, 180);

    popover.showPopover(
      option("trimethoprim"),
      eventWithRect({ bottom: 170, left: 450, top: 150, width: 40 }),
    );

    expect(popover.popoverStyle.value.top).toBe("16px");
    expect(popover.popoverStyle.value.left).toBe("320px");
  });

  it("clamps width and horizontal position on narrow screens", () => {
    const popover = usePopover();
    setViewport(260, 600);

    popover.showPopover(option("fosfomycine"), eventWithRect({ bottom: 120, left: 8, width: 24 }));

    expect(popover.popoverStyle.value.maxWidth).toBe("228px");
    expect(popover.popoverStyle.value.left).toBe("16px");
  });

  it("schedules, cancels, and closes without leaking stale timers", () => {
    const popover = usePopover();
    popover.showPopover(option("ciprofloxacine"), eventWithRect({ bottom: 80, left: 200 }));

    popover.schedulePopoverClose();
    vi.advanceTimersByTime(299);
    expect(popover.activePopoverOptionId.value).toBe("ciprofloxacine");

    popover.cancelPopoverClose();
    vi.advanceTimersByTime(1);
    expect(popover.activePopoverOptionId.value).toBe("ciprofloxacine");

    popover.schedulePopoverClose();
    vi.advanceTimersByTime(300);
    expect(popover.activePopoverOptionId.value).toBeNull();
    expect(popover.popoverStyle.value.visibility).toBe("hidden");
    expect(popover.popoverStyle.value.opacity).toBe(0);
  });

  it("clears pending closes when a new popover opens", () => {
    const popover = usePopover();
    popover.showPopover(option("first"), eventWithRect({ bottom: 80, left: 200 }));

    popover.schedulePopoverClose();
    popover.showPopover(option("second", ""), eventWithRect({ bottom: 120, left: 240 }));
    vi.advanceTimersByTime(300);

    expect(popover.activePopoverOptionId.value).toBe("second");
    expect(popover.popoverDescription.value).toBe("");
    expect(popover.popoverStyle.value.visibility).toBe("visible");
  });

  it("replaces repeated close schedules and clears the pending timeout on manual close", () => {
    const popover = usePopover();
    popover.showPopover(option("a"), eventWithRect({ bottom: 80, left: 200 }));

    popover.schedulePopoverClose();
    vi.advanceTimersByTime(100);
    popover.schedulePopoverClose();
    vi.advanceTimersByTime(299);
    expect(popover.activePopoverOptionId.value).toBe("a");

    popover.closePopover();
    vi.advanceTimersByTime(1);
    expect(popover.activePopoverOptionId.value).toBeNull();
    expect(popover.popoverStyle.value.visibility).toBe("hidden");
  });

  it("toggles the active option without leaving stale copy visible", () => {
    const popover = usePopover();
    const event = eventWithRect({ bottom: 80, left: 200 });

    popover.togglePopover(option("a", "Eerste uitleg"), event);
    expect(popover.activePopoverOptionId.value).toBe("a");
    expect(popover.popoverDescription.value).toBe("Eerste uitleg");

    popover.togglePopover(option("a", "Eerste uitleg"), event);
    expect(popover.activePopoverOptionId.value).toBeNull();

    popover.togglePopover(option("b"), event);
    expect(popover.activePopoverOptionId.value).toBe("b");
    expect(popover.popoverDescription.value).toBe("Toelichting");
  });
});
