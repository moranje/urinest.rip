import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { persistTelemetry } from "../log-sink";
import { initWebVitalsTelemetry } from "../web-vitals";

vi.mock("../log-sink", () => ({
  persistTelemetry: vi.fn(),
}));

type ObserverType = "event" | "largest-contentful-paint" | "layout-shift" | "paint";

interface MockObserver {
  callback: (list: { getEntries: () => PerformanceEntry[] }) => void;
  disconnect: ReturnType<typeof vi.fn>;
  type: ObserverType | null;
}

const observers: MockObserver[] = [];

class MockPerformanceObserver implements MockObserver {
  disconnect = vi.fn();
  type: ObserverType | null = null;

  constructor(public callback: (list: { getEntries: () => PerformanceEntry[] }) => void) {}

  observe(options: { type: ObserverType }): void {
    this.type = options.type;
    observers.push(this);
  }
}

function emitEntries(type: ObserverType, entries: PerformanceEntry[]): void {
  const observer = observers.find((candidate) => candidate.type === type);
  expect(observer, type).toBeDefined();
  observer?.callback({ getEntries: () => entries });
}

function setVisibilityState(value: DocumentVisibilityState): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value,
  });
}

describe("web vitals telemetry", () => {
  beforeEach(() => {
    observers.length = 0;
    vi.mocked(persistTelemetry).mockReset();
    vi.stubGlobal("PerformanceObserver", MockPerformanceObserver);
    setVisibilityState("visible");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records first contentful paint without route or DOM payload", () => {
    const cleanup = initWebVitalsTelemetry();

    emitEntries("paint", [
      {
        name: "first-contentful-paint",
        startTime: 1234.4,
      } as PerformanceEntry,
    ]);

    expect(persistTelemetry).toHaveBeenCalledWith({
      module: "web-vitals",
      message: "web_vital.fcp",
      context: {
        metric: "FCP",
        rating: "good",
        value: 1234,
        visibilityState: "visible",
      },
    });
    cleanup();
  });

  it("flushes LCP, CLS and INP as final privacy-safe metrics", () => {
    const cleanup = initWebVitalsTelemetry();

    emitEntries("largest-contentful-paint", [{ name: "", startTime: 2600.2 } as PerformanceEntry]);
    emitEntries("layout-shift", [
      { hadRecentInput: false, name: "", startTime: 0, value: 0.08 } as unknown as PerformanceEntry,
      { hadRecentInput: true, name: "", startTime: 0, value: 0.4 } as unknown as PerformanceEntry,
      { hadRecentInput: false, name: "", startTime: 0, value: 0.04 } as unknown as PerformanceEntry,
    ]);
    emitEntries("event", [
      {
        duration: 320.5,
        interactionId: 7,
        name: "click",
        startTime: 0,
        target: { textContent: "Nitriet positief" },
      } as unknown as PerformanceEntry,
    ]);

    setVisibilityState("hidden");
    document.dispatchEvent(new Event("visibilitychange"));

    expect(persistTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          metric: "LCP",
          rating: "needs-improvement",
          value: 2600,
        }),
        message: "web_vital.lcp",
      }),
    );
    expect(persistTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          metric: "CLS",
          rating: "needs-improvement",
          value: 0.12,
        }),
        message: "web_vital.cls",
      }),
    );
    expect(persistTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          metric: "INP",
          rating: "needs-improvement",
          value: 321,
        }),
        message: "web_vital.inp",
      }),
    );
    expect(JSON.stringify(vi.mocked(persistTelemetry).mock.calls)).not.toContain("Nitriet");
    cleanup();
  });

  it("is a no-op when PerformanceObserver is unavailable", () => {
    vi.stubGlobal("PerformanceObserver", undefined);

    expect(() => initWebVitalsTelemetry()).not.toThrow();

    expect(persistTelemetry).not.toHaveBeenCalled();
  });
});
