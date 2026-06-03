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

  it("drops runtime-only telemetry extras before persistence", () => {
    const persist = vi.fn();
    const adapter = createSupabaseTelemetryAdapter({ persist });

    const eventWithRuntimeExtras = {
      type: "conditions.validate_failed",
      phase: "conditions.validate",
      storeId: "questionnaire",
      questionnaireId: "strip",
      conditionCount: 3,
      errorClass: "ValidationError",
      answers: { email: "patient@example.test", nitriet: "positive" },
      email: "patient@example.test",
      token: "secret-token",
      error: new Error("contains patient@example.test and secret-token"),
    } as Parameters<typeof adapter.track>[0];

    adapter.track(eventWithRuntimeExtras);

    const persisted = persist.mock.calls[0]?.[0];
    expect(persisted.context).toEqual({
      type: "conditions.validate_failed",
      phase: "conditions.validate",
      storeId: "questionnaire",
      questionnaireId: "strip",
      conditionCount: 3,
      errorClass: "ValidationError",
    });
    expect(JSON.stringify(persisted)).not.toContain("answers");
    expect(JSON.stringify(persisted)).not.toContain("patient@example.test");
    expect(JSON.stringify(persisted)).not.toContain("secret-token");
    expect(JSON.stringify(persisted)).not.toContain("contains patient");
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
