import { describe, expect, it } from "vitest";
import { appendBreadcrumb, cloneBreadcrumbs, createBreadcrumb } from "./breadcrumbs";

describe("breadcrumbs", () => {
  it("creates immutable typed breadcrumbs", () => {
    const breadcrumb = createBreadcrumb(
      {
        type: "click",
        message: "role-change",
        data: { from: "triage", to: "clinician" },
      },
      { timestamp: "2026-06-01T00:00:00.000Z" },
    );

    expect(breadcrumb).toEqual({
      type: "click",
      message: "role-change",
      data: { from: "triage", to: "clinician" },
      timestamp: "2026-06-01T00:00:00.000Z",
      count: undefined,
    });
    expect(Object.isFrozen(breadcrumb)).toBe(true);
    expect(Object.isFrozen(breadcrumb.data)).toBe(true);
  });

  it("deduplicates consecutive breadcrumb messages and keeps max length", () => {
    const trail = [
      { type: "navigation" as const, message: "start" },
      { type: "click" as const, message: "same" },
      { type: "click" as const, message: "same", data: { scrub_hits_total: 1 } },
      { type: "api" as const, message: "GET /main.json" },
    ].reduce(
      (current, input, index) =>
        appendBreadcrumb(current, input, {
          maxLength: 2,
          now: () => `2026-06-01T00:00:0${index}.000Z`,
        }),
      [] as readonly ReturnType<typeof createBreadcrumb>[],
    );

    expect(trail).toEqual([
      {
        type: "click",
        message: "same",
        data: { scrub_hits_total: 1 },
        timestamp: "2026-06-01T00:00:02.000Z",
        count: 2,
      },
      {
        type: "api",
        message: "GET /main.json",
        data: undefined,
        timestamp: "2026-06-01T00:00:03.000Z",
        count: undefined,
      },
    ]);
  });

  it("clones breadcrumb data for app-owned buffers", () => {
    const trail = appendBreadcrumb([], {
      type: "log",
      message: "warn",
      data: { module: "app" },
    });

    const clone = cloneBreadcrumbs(trail);
    expect(clone).toEqual(trail);
    expect(clone).not.toBe(trail);
    expect(clone[0]?.data).not.toBe(trail[0]?.data);
  });
});
