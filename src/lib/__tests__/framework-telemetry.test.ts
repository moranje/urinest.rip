import { describe, expect, it, vi } from "vitest";
import { createSupabaseTelemetryAdapter } from "../framework-telemetry";

describe("framework telemetry adapter", () => {
  it("persists framework telemetry events through the app log sink contract", () => {
    const persist = vi.fn();
    const adapter = createSupabaseTelemetryAdapter({ module: "questionnaire-store", persist });

    adapter.track({
      type: "manifest.loaded",
      storeId: "questionnaire",
      questionnaireCount: 8,
    });

    expect(persist).toHaveBeenCalledWith({
      module: "questionnaire-store",
      message: "manifest.loaded",
      level: "info",
      context: {
        type: "manifest.loaded",
        storeId: "questionnaire",
        questionnaireCount: 8,
      },
    });
  });

  it("marks failed framework events as warnings without leaking Error objects", () => {
    const persist = vi.fn();
    const adapter = createSupabaseTelemetryAdapter({ persist });

    adapter.track({
      type: "manifest.load_failed",
      phase: "manifest.load",
      storeId: "questionnaire",
      errorClass: "TimeoutError",
    });

    expect(persist).toHaveBeenCalledWith({
      module: "framework",
      message: "manifest.load_failed",
      level: "warn",
      context: {
        type: "manifest.load_failed",
        phase: "manifest.load",
        storeId: "questionnaire",
        errorClass: "TimeoutError",
      },
    });
    expect(JSON.stringify(persist.mock.calls)).not.toContain("Error:");
  });

  it("does not let telemetry persistence failures break framework execution", () => {
    const persist = vi.fn(() => {
      throw new Error("Supabase unavailable");
    });
    const adapter = createSupabaseTelemetryAdapter({ persist });

    expect(() =>
      adapter.track({
        type: "answers.persist_failed",
        phase: "answers.persist",
        storeId: "questionnaire",
        errorClass: "QuotaExceededError",
      }),
    ).not.toThrow();
  });
});
